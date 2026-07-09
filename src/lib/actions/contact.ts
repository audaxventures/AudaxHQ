"use server";

import { sendContactFormEmail } from "@/lib/email";

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

  try {
    await sendContactFormEmail(name, email, message);
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Couldn't send your message. Try again later." };
  }

  return { success: true, error: null };
}
