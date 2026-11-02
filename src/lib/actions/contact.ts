"use server";

import { headers } from "next/headers";
import { sendContactFormEmail } from "@/lib/email";
import { isTurnstileEnabled, TURNSTILE_RESPONSE_FIELD, verifyTurnstileToken } from "@/lib/turnstile";

export interface ContactFormState {
  success: boolean;
  error: string | null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { success: false, error: "Fill in your name, email, and a message." };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { success: false, error: "That email address doesn't look right." };
  }

  // Bot check. Skipped only when TURNSTILE_SECRET_KEY isn't configured (e.g. local dev).
  if (isTurnstileEnabled()) {
    const token = String(formData.get(TURNSTILE_RESPONSE_FIELD) ?? "");
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    if (!(await verifyTurnstileToken(token, ip))) {
      return { success: false, error: "Couldn't verify you're human. Complete the check and try again." };
    }
  }

  try {
    await sendContactFormEmail(name, email, message);
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Couldn't send your message. Try again later." };
  }

  return { success: true, error: null };
}
