"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  computeSessionToken,
  generateResetToken,
  hashPasscode,
  hashResetToken,
  isCorrectPasscode,
  isValidResetToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { getProfile } from "@/lib/data/profile";
import * as appSettings from "@/lib/data/appSettings";
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

  const profile = await getProfile();
  const emailMatches = email.length > 0 && email.toLowerCase() === profile.email.trim().toLowerCase();

  if (!emailMatches || !passcode || !(await isCorrectPasscode(passcode))) {
    return { error: "That email or passcode isn't right. Try again." };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, computeSessionToken(), {
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
  if (email.toLowerCase() !== profile.email.trim().toLowerCase()) {
    return generic;
  }

  const token = generateResetToken();
  await appSettings.setPasscodeResetToken(hashResetToken(token), new Date(Date.now() + RESET_TOKEN_TTL_MS));

  const host = (await headers()).get("host");
  const protocol = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";
  const resetUrl = `${protocol}://${host}/login/reset-passcode?token=${token}`;

  try {
    await sendPasscodeResetEmail(profile.email, resetUrl);
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

  const stored = await appSettings.getPasscodeResetToken();
  const invalid = { error: "This reset link is invalid or has expired. Request a new one." };
  if (!stored || stored.expiresAt < new Date()) return invalid;
  if (!token || !isValidResetToken(hashResetToken(token), stored.tokenHash)) return invalid;

  const { hash, salt } = hashPasscode(newPasscode);
  await appSettings.setPasscodeCredentials(hash, salt);
  await appSettings.clearPasscodeResetToken();

  redirect("/login?reset=1");
}

