"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSessionToken,
  generateResetToken,
  hashPasscode,
  hashResetToken,
  isCorrectPasscode,
  isCorrectPasscodeHash,
  isValidResetToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { getProfile } from "@/lib/data/profile";
import * as appSettings from "@/lib/data/appSettings";
import * as teamMembers from "@/lib/data/teamMembers";
import { sendPasscodeResetEmail } from "@/lib/email";

export interface LoginState {
  error: string | null;
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const passcode = String(formData.get("passcode") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!email || !passcode) {
    return { error: "That email or passcode isn't right. Try again." };
  }

  const profile = await getProfile();
  const emailMatches = email.toLowerCase() === profile.email.trim().toLowerCase();

  let token: string | null = null;
  if (emailMatches && (await isCorrectPasscode(passcode))) {
    token = createSessionToken({ role: "OWNER" });
  } else {
    const credentials = await teamMembers.getTeamMemberCredentialsByEmail(email);
    if (credentials && credentials.active && isCorrectPasscodeHash(passcode, credentials.hash, credentials.salt)) {
      token = createSessionToken({ role: "TEAM_MEMBER", teamMemberId: credentials.id });
    }
  }

  if (!token) {
    return { error: "That email or passcode isn't right. Try again." };
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
 * submitted email matched the profile — doesn't reveal whether an email is
 * "the" account email. Only surfaces a real error when sending genuinely
 * fails after a match, which is operator-troubleshooting info, not a leak.
 */
export async function requestPasscodeReset(
  _prevState: ForgotPasscodeState,
  formData: FormData
): Promise<ForgotPasscodeState> {
  const email = String(formData.get("email") ?? "").trim();
  const generic: ForgotPasscodeState = {
    message: "If that email is on file, we've sent a link to reset your passcode.",
    error: null,
  };
  if (!email) return generic;

  const profile = await getProfile();
  const isOwner = email.toLowerCase() === profile.email.trim().toLowerCase();
  const teamMemberId = isOwner ? null : await teamMembers.getTeamMemberIdByEmail(email);
  if (!isOwner && !teamMemberId) return generic;

  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  if (isOwner) {
    await appSettings.setPasscodeResetToken(hashResetToken(token), expiresAt);
  } else {
    await teamMembers.setTeamMemberResetToken(teamMemberId!, hashResetToken(token), expiresAt);
  }

  const host = (await headers()).get("host");
  const protocol = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";
  const resetUrl = `${protocol}://${host}/login/reset-passcode?token=${token}`;

  try {
    await sendPasscodeResetEmail(email, resetUrl);
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

  const stored = await appSettings.getPasscodeResetToken();
  if (stored && stored.expiresAt >= new Date() && isValidResetToken(tokenHash, stored.tokenHash)) {
    const { hash, salt } = hashPasscode(newPasscode);
    await appSettings.setPasscodeCredentials(hash, salt);
    await appSettings.clearPasscodeResetToken();
    redirect("/login?reset=1");
  }

  const teamMember = await teamMembers.findTeamMemberByResetTokenHash(tokenHash);
  if (!teamMember) return invalid;

  await teamMembers.setTeamMemberPasscode(teamMember.id, newPasscode);
  redirect("/login?reset=1");
}

