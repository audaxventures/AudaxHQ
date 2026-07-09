"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSessionToken,
  generateResetToken,
  hashPasscode,
  hashResetToken,
  isCorrectPasscodeHash,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { lookupAccountEmail } from "@/lib/data/accountEmails";
import * as businesses from "@/lib/data/businesses";
import * as teamMembers from "@/lib/data/teamMembers";
import { sendPasscodeResetEmail } from "@/lib/email";

export interface LoginState {
  error: string | null;
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const passcode = String(formData.get("passcode") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!email || !passcode) {
    return { error: "That email or passcode isn't right. Try again." };
  }

  const genericError = { error: "That email or passcode isn't right. Try again." };
  const lookup = await lookupAccountEmail(email);
  if (!lookup) return genericError;

  let token: string | null = null;
  if (lookup.role === "OWNER") {
    const creds = await businesses.getPasscodeCredentials(lookup.businessId);
    if (isCorrectPasscodeHash(passcode, creds.hash, creds.salt)) {
      token = createSessionToken({ role: "OWNER", businessId: lookup.businessId });
    }
  } else {
    const credentials = await teamMembers.getTeamMemberCredentials(lookup.teamMemberId!);
    if (credentials && credentials.active && isCorrectPasscodeHash(passcode, credentials.hash, credentials.salt)) {
      token = createSessionToken({ role: "TEAM_MEMBER", businessId: lookup.businessId, teamMemberId: credentials.id });
    }
  }

  if (!token) {
    return genericError;
  }

  // Checked only after the passcode has already been confirmed correct —
  // checking earlier would let someone probe arbitrary emails to learn
  // whether a business is suspended without knowing its passcode.
  const business = await businesses.getBusiness(lookup.businessId);
  if (business.suspendedAt) {
    return { error: "This workspace has been suspended. Contact support." };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(next.startsWith("/") ? next : "/");
}

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export interface ForgotPasscodeState {
  message: string | null;
  error: string | null;
}

/**
 * Always resolves with the same generic message regardless of whether the
 * submitted email matched an account — doesn't reveal whether an email is
 * on file. Only surfaces a real error when sending genuinely fails after a
 * match, which is operator-troubleshooting info, not a leak.
 */
export async function requestPasscodeReset(
  _prevState: ForgotPasscodeState,
  formData: FormData
): Promise<ForgotPasscodeState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const generic: ForgotPasscodeState = {
    message: "If that email is on file, we've sent a link to reset your passcode.",
    error: null,
  };
  if (!email) return generic;

  const lookup = await lookupAccountEmail(email);
  if (!lookup) return generic;

  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  let name: string;
  if (lookup.role === "OWNER") {
    await businesses.setPasscodeResetToken(lookup.businessId, hashResetToken(token), expiresAt);
    name = (await businesses.getBusiness(lookup.businessId)).ownerName;
  } else {
    await teamMembers.setTeamMemberResetToken(lookup.teamMemberId!, hashResetToken(token), expiresAt);
    const teamMember = await teamMembers.getTeamMember(lookup.teamMemberId!, lookup.businessId);
    name = teamMember?.name ?? "there";
  }

  const host = (await headers()).get("host");
  const protocol = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";
  const resetUrl = `${protocol}://${host}/login/reset-passcode?token=${token}`;

  try {
    await sendPasscodeResetEmail(email, name, resetUrl);
  } catch (e) {
    return { message: null, error: e instanceof Error ? e.message : "Couldn't send the reset email. Try again later." };
  }

  return generic;
}

export interface ResetPasscodeState {
  error: string | null;
}

export async function resetPasscode(
  _prevState: ResetPasscodeState,
  formData: FormData
): Promise<ResetPasscodeState> {
  const token = String(formData.get("token") ?? "");
  const newPasscode = String(formData.get("newPasscode") ?? "");
  const confirmPasscode = String(formData.get("confirmPasscode") ?? "");

  if (newPasscode.length < 4) {
    return { error: "New passcode must be at least 4 characters." };
  }
  if (newPasscode !== confirmPasscode) {
    return { error: "New passcode and confirmation don't match." };
  }

  const invalid = { error: "This reset link is invalid or has expired. Request a new one." };
  if (!token) return invalid;
  const tokenHash = hashResetToken(token);

  const business = await businesses.findBusinessByResetTokenHash(tokenHash);
  if (business) {
    const { hash, salt } = hashPasscode(newPasscode);
    await businesses.setPasscodeCredentials(business.id, hash, salt);
    await businesses.clearPasscodeResetToken(business.id);
    redirect("/login?reset=1");
  }

  const teamMember = await teamMembers.findTeamMemberByResetTokenHash(tokenHash);
  if (!teamMember) return invalid;

  await teamMembers.setTeamMemberPasscode(teamMember.id, newPasscode);
  redirect("/login?reset=1");
}
