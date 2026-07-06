"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { computeSessionToken, isCorrectPasscode, SESSION_COOKIE_NAME } from "@/lib/auth";
import { getProfile } from "@/lib/data/profile";

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

