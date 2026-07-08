"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, hashPasscode, SESSION_COOKIE_NAME } from "@/lib/auth";
import { createBusiness } from "@/lib/data/businesses";
import { DEFAULT_TIMEZONE } from "@/lib/timezone";

export interface SignupState {
  error: string | null;
}

const UNIQUE_VIOLATION = "23505";

export async function signup(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const businessName = String(formData.get("businessName") ?? "").trim();
  const ownerName = String(formData.get("ownerName") ?? "").trim();
  const ownerEmail = String(formData.get("ownerEmail") ?? "").trim().toLowerCase();
  const passcode = String(formData.get("passcode") ?? "");
  const confirmPasscode = String(formData.get("confirmPasscode") ?? "");
  const timezone = String(formData.get("timezone") ?? "").trim() || DEFAULT_TIMEZONE;

  if (!businessName || !ownerName || !ownerEmail) {
    return { error: "Fill in your business name, name, and email." };
  }
  if (passcode.length < 4) {
    return { error: "Passcode must be at least 4 characters." };
  }
  if (passcode !== confirmPasscode) {
    return { error: "Passcode and confirmation don't match." };
  }

  const { hash, salt } = hashPasscode(passcode);

  let businessId: string;
  try {
    const business = await createBusiness({
      name: businessName,
      ownerName,
      ownerEmail,
      passcodeHash: hash,
      passcodeSalt: salt,
      timezone,
    });
    businessId = business.id;
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === UNIQUE_VIOLATION) {
      return { error: "That email is already registered. Try signing in instead." };
    }
    throw e;
  }

  const token = createSessionToken({ role: "OWNER", businessId });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/");
}
