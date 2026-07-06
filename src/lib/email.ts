// Thin, dependency-free wrapper over Resend's REST API — just one email
// (passcode reset) is sent today, so a full SDK isn't worth the extra
// dependency.

const RESEND_API_URL = "https://api.resend.com/emails";

function resendApiKey(): string {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error(
      "RESEND_API_KEY is not set. Add it to your environment to enable passcode reset emails (see .env.example)."
    );
  }
  return key;
}

export async function sendPasscodeResetEmail(to: string, resetUrl: string): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL || "Audax HQ <onboarding@resend.dev>";

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Reset your Audax HQ passcode",
      html: `
        <p>Someone requested a passcode reset for your Audax HQ workspace.</p>
        <p><a href="${resetUrl}">Click here to set a new passcode</a>. This link expires in 30 minutes.</p>
        <p>If you didn't request this, you can safely ignore this email — your passcode won't change unless the link above is used.</p>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to send reset email (${res.status}): ${body || res.statusText}`);
  }
}
