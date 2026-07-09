// Thin, dependency-free wrapper over Resend's REST API — just a couple of
// transactional emails are sent today, so a full SDK isn't worth the extra
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

const WELCOME_TIPS: { title: string; body: string }[] = [
  {
    title: "Make it yours",
    body: "Upload your logo and fill in your business details under Settings &rarr; Profile and Business Info.",
  },
  {
    title: "Customize your picklists",
    body: "Tailor your work types, lead sources, and to-do types under Settings so every tag matches how you actually work.",
  },
  {
    title: "Add your first client or lead",
    body: "Everything else — notes, tasks, invoices, time — lives on that record, so this is the natural place to start.",
  },
  {
    title: "Bring your team in",
    body: "Add team members under Settings &rarr; Team Members and choose exactly which clients each person can see.",
  },
  {
    title: "Track time and revenue",
    body: "Log hours in the Hour &amp; Cost Tracker and keep an eye on invoices and profitability from any client's page.",
  },
];

/**
 * Sent once, right after a new workspace signs up. Plain inline-styled HTML
 * (no React Email / template engine) to match sendPasscodeResetEmail's
 * dependency-free approach — email clients need inline CSS regardless, so a
 * template component wouldn't save much here.
 */
export async function sendWelcomeEmail(to: string, ownerName: string, businessName: string, appUrl: string): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL || "Audax HQ <onboarding@resend.dev>";
  const firstName = ownerName.trim().split(/\s+/)[0] || ownerName;

  const tipsHtml = WELCOME_TIPS.map(
    (tip, i) => `
      <tr>
        <td style="padding: 14px 0; border-top: 1px solid #e9ecf2;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width: 28px; vertical-align: top; padding-top: 2px;">
                <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 999px; background: #f7e2cc; color: #7a3512; font-size: 12px; font-weight: 700; font-family: Georgia, 'Times New Roman', serif;">${i + 1}</span>
              </td>
              <td style="vertical-align: top; padding-left: 8px;">
                <p style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #101d33;">${tip.title}</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #4c5f82;">${tip.body}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
  ).join("");

  const html = `
    <div style="background: #fdfbf6; padding: 32px 16px; font-family: Helvetica, Arial, sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto;">
        <tr>
          <td style="padding-bottom: 24px; text-align: center;">
            <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 15px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #be5a1e;">Audax HQ</span>
          </td>
        </tr>
        <tr>
          <td style="background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 2px rgba(16,29,51,0.06);">
            <h1 style="margin: 0 0 12px; font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: 600; color: #101d33;">Welcome, ${firstName}</h1>
            <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #4c5f82;">
              ${businessName} is ready to go. Here's a quick map to get you moving fast.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 8px;">
              <tr>
                <td style="padding-bottom: 8px;">
                  <p style="margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #4c5f82;">Helpful hints to get started</p>
                </td>
              </tr>
              ${tipsHtml}
            </table>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
              <tr>
                <td style="border-radius: 10px; background: #be5a1e;">
                  <a href="${appUrl}" style="display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 600; color: #fdfbf6; text-decoration: none;">Open Audax HQ</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding-top: 24px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #7c8aa3;">We're glad you're here — just reply if you have any questions.</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Welcome to Audax HQ — here's how to get started",
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to send welcome email (${res.status}): ${body || res.statusText}`);
  }
}
