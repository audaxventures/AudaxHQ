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

const WELCOME_STEPS: { title: string; body: string; bg: string; fg: string }[] = [
  {
    title: "Make it yours",
    body: "Upload your logo and fill in your business details under Settings &rarr; Profile and Business Info.",
    bg: "#ede9fe",
    fg: "#7c3aed",
  },
  {
    title: "Customize your picklists",
    body: "Tailor your work types, lead sources, and to-do types under Settings so every tag matches how you actually work.",
    bg: "#f7e2cc",
    fg: "#7a3512",
  },
  {
    title: "Add your first client or lead",
    body: "Everything else — notes, tasks, invoices, time — lives on that record, so this is the natural place to start.",
    bg: "#f0dbe3",
    fg: "#a13b5f",
  },
  {
    title: "Bring your team in",
    body: "Add team members under Settings &rarr; Team Members and choose exactly which clients each person can see.",
    bg: "#e1ebe2",
    fg: "#3f6c4c",
  },
  {
    title: "Track time and revenue",
    body: "Log hours in the Hour &amp; Cost Tracker and keep an eye on invoices and profitability from any client's page.",
    bg: "#dceaf2",
    fg: "#2f6f9e",
  },
];

/**
 * Sent once, right after a new workspace signs up. Plain inline-styled HTML
 * (no React Email / template engine) to match sendPasscodeResetEmail's
 * dependency-free approach — email clients need inline CSS regardless, so a
 * template component wouldn't save much here. The dashboard mockup image is
 * the same static /dashboard-preview.png used in the in-app welcome popup
 * (see src/components/WelcomeModal.tsx) — regenerate it there if the app's
 * look changes.
 */
export async function sendWelcomeEmail(to: string, ownerName: string, businessName: string, appUrl: string): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL || "Audax HQ <onboarding@resend.dev>";
  const firstName = ownerName.trim().split(/\s+/)[0] || ownerName;
  const origin = new URL(appUrl).origin;
  const previewImageUrl = `${origin}/dashboard-preview.png`;
  const supportEmail = "info@audaxventures.ca";

  const stepsHtml = WELCOME_STEPS.map(
    (step, i) => `
      <tr>
        <td style="padding: 16px 0; ${i > 0 ? "border-top: 1px solid #e9ecf2;" : ""}">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="width: 44px; vertical-align: top;">
                <span style="display: inline-block; width: 36px; height: 36px; line-height: 36px; text-align: center; border-radius: 10px; background: ${step.bg}; color: ${step.fg}; font-size: 15px; font-weight: 700; font-family: Georgia, 'Times New Roman', serif;">${i + 1}</span>
              </td>
              <td style="vertical-align: top; padding-left: 6px;">
                <p style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #101d33;">${step.title}</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.55; color: #4c5f82;">${step.body}</p>
              </td>
              <td style="width: 18px; vertical-align: top; padding-top: 8px; text-align: right; color: #aeb8cb; font-size: 16px;">&rsaquo;</td>
            </tr>
          </table>
        </td>
      </tr>
    `
  ).join("");

  const html = `
    <div style="background: #f0e6d2; padding: 32px 16px; font-family: Helvetica, Arial, sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 0 auto;">
        <tr>
          <td style="border-radius: 20px 20px 0 0; overflow: hidden; background: linear-gradient(135deg, #e9ecf2, #dceaf2);">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding: 28px 32px; vertical-align: middle;">
                  <table role="presentation" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="vertical-align: middle; padding-right: 8px;">
                        <img src="${origin}/favicon.png" width="24" height="24" alt="" style="display: block; border-radius: 50%;" />
                      </td>
                      <td style="vertical-align: middle;">
                        <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 17px; font-weight: 700; color: #101d33;">AUDAX <span style="color: #be5a1e;">HQ</span></span>
                      </td>
                    </tr>
                  </table>
                </td>
                <td style="padding: 16px 20px 0 0; text-align: right;">
                  <img src="${previewImageUrl}" width="230" alt="" style="display: inline-block; max-width: 230px; height: auto; border-radius: 10px; box-shadow: 0 8px 24px -8px rgba(16,29,51,0.35);" />
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background: #ffffff; padding: 32px;">
            <h1 style="margin: 0 0 8px; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: 600; color: #101d33;">Welcome, ${firstName}</h1>
            <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #4c5f82;">${businessName} is ready to go.</p>
            <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #4c5f82;">Here's a quick map to get you moving fast.</p>

            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 8px;">
              <tr>
                <td style="vertical-align: middle; padding-bottom: 4px;">
                  <span style="display: inline-block; width: 20px; height: 20px; line-height: 20px; text-align: center; border-radius: 50%; background: #e9ecf2; color: #4c5f82; font-size: 11px; margin-right: 6px;">&#8623;</span>
                  <span style="font-size: 13px; font-weight: 700; letter-spacing: 0.02em; color: #101d33;">5 steps to get started</span>
                </td>
              </tr>
              ${stepsHtml}
            </table>

            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
              <tr>
                <td style="border-radius: 10px; background: #101d33;">
                  <a href="${appUrl}" style="display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 600; color: #fdfbf6; text-decoration: none;">Open Audax HQ &rarr;</a>
                </td>
                <td style="padding-left: 14px; font-size: 13px; color: #7c8aa3;">Your business, organized and running in one place.</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background: #fdfbf6; border-radius: 0 0 20px 20px; padding: 24px 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="width: 40px; vertical-align: top;">
                  <span style="display: inline-block; width: 32px; height: 32px; line-height: 32px; text-align: center; border-radius: 50%; background: #101d33; color: #fdfbf6; font-size: 14px;">&#9742;</span>
                </td>
                <td style="vertical-align: top; padding-left: 6px;">
                  <p style="margin: 0 0 4px; font-size: 13px; font-weight: 700; color: #101d33;">We're glad you're here.</p>
                  <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #7c8aa3;">
                    If you have any questions or need support, email
                    <a href="mailto:${supportEmail}" style="color: #be5a1e; text-decoration: none;">${supportEmail}</a>
                    — we're happy to help.
                  </p>
                </td>
                <td style="vertical-align: bottom; text-align: right; padding-left: 12px; white-space: nowrap;">
                  <span style="font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 14px; color: #4c5f82;">The Audax HQ Team</span>
                </td>
              </tr>
            </table>
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
