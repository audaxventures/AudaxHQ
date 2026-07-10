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

/**
 * Sent whenever someone requests a passcode reset (owner or team member —
 * `name` is whichever of the two the reset was resolved to, so the greeting
 * always addresses the actual person, not a generic "there"). Same
 * dependency-free inline-HTML approach as sendWelcomeEmail, including its
 * footer support line — see the comment above that function.
 */
export async function sendPasscodeResetEmail(to: string, name: string, resetUrl: string): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL || "Audax HQ <onboarding@resend.dev>";
  const firstName = name.trim().split(/\s+/)[0] || name;
  const origin = new URL(resetUrl).origin;
  const supportEmail = "info@audaxventures.ca";
  const supportMailto = `mailto:${supportEmail}`;

  const passcodeDots = Array.from({ length: 6 })
    .map(
      () =>
        `<span style="display: inline-block; width: 10px; height: 10px; margin: 0 4px; border-radius: 50%; background: #223655;"></span>`
    )
    .join("");

  const html = `
    <div style="background: #f8f2e6; padding: 32px 16px; font-family: Helvetica, Arial, sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 0 auto;">
        <tr>
          <td style="background: #ffffff; border-radius: 20px 20px 0 0; padding: 24px 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="vertical-align: middle;">
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
                <td style="text-align: right; font-size: 13px; color: #4c5f82;">
                  Need help? <a href="${supportMailto}" style="color: #be5a1e; text-decoration: none; font-weight: 600;">Contact our team &rarr;</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background: linear-gradient(135deg, #dceaf2, #ede9fe); padding: 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="vertical-align: top; width: 60%;">
                  <span style="display: inline-block; width: 44px; height: 44px; line-height: 44px; text-align: center; border-radius: 50%; background: #ffffff; font-size: 20px; margin-bottom: 16px;">&#128274;</span>
                  <h1 style="margin: 0 0 12px; font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: 600; color: #101d33; line-height: 1.2;">Reset your Audax HQ passcode</h1>
                  <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #4c5f82;">We received a request to reset the passcode for your workspace.</p>
                </td>
                <td style="vertical-align: middle; width: 40%; text-align: right;">
                  <table role="presentation" cellpadding="0" cellspacing="0" style="display: inline-table; background: #ffffff; border-radius: 14px; box-shadow: 0 12px 28px -12px rgba(16,29,51,0.3);">
                    <tr>
                      <td style="padding: 24px 20px; text-align: center;">
                        <span style="display: inline-block; width: 32px; height: 32px; line-height: 32px; text-align: center; border-radius: 50%; background: #e9ecf2; font-size: 15px; margin-bottom: 12px;">&#128274;</span>
                        <div>${passcodeDots}</div>
                        <div style="margin-top: 10px; height: 2px; width: 100%; background: #d3d9e5;"></div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background: #ffffff; padding: 32px;">
            <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.6; color: #101d33;">Hi <span style="font-weight: 700;">${firstName}</span>,</p>
            <p style="margin: 0 0 8px; font-size: 15px; line-height: 1.6; color: #4c5f82;">You can reset your passcode by clicking the button below.</p>
            <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #4c5f82;">This link will expire in <span style="font-weight: 700; color: #be5a1e;">30 minutes</span> for your security.</p>

            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
              <tr>
                <td style="border-radius: 10px; background: #101d33;">
                  <a href="${resetUrl}" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; color: #fdfbf6; text-decoration: none;">Reset my passcode &rarr;</a>
                </td>
              </tr>
            </table>

            <p style="margin: 0 0 4px; font-size: 12px; color: #7c8aa3;">Or copy and paste this link into your browser:</p>
            <p style="margin: 0 0 24px; font-size: 12px; word-break: break-all;">
              <a href="${resetUrl}" style="color: #2f6f9e; text-decoration: underline;">${resetUrl}</a>
            </p>

            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: #f7e2cc; border-radius: 14px;">
              <tr>
                <td style="padding: 18px 20px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="width: 40px; vertical-align: top;">
                        <span style="display: inline-block; width: 32px; height: 32px; line-height: 32px; text-align: center; border-radius: 50%; background: #ffffff; color: #9c4416; font-size: 15px; font-weight: 700;">&#10003;</span>
                      </td>
                      <td style="vertical-align: top; padding-left: 6px;">
                        <p style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #101d33;">Didn't request this?</p>
                        <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #7a3512;">
                          If you didn't request a passcode reset, you can safely ignore this email. Your passcode won't change unless you use the link above.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background: #fdfbf6; padding: 24px 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="width: 40px; vertical-align: top;">
                  <span style="display: inline-block; width: 32px; height: 32px; line-height: 32px; text-align: center; border-radius: 50%; background: #101d33; color: #fdfbf6; font-size: 14px;">&#9742;</span>
                </td>
                <td style="vertical-align: top; padding-left: 6px;">
                  <p style="margin: 0 0 4px; font-size: 13px; font-weight: 700; color: #101d33;">Need help?</p>
                  <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #7c8aa3;">
                    Our team is here if you have any questions. Email
                    <a href="${supportMailto}" style="color: #be5a1e; text-decoration: none;">${supportEmail}</a>
                    and we'll get back to you quickly.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background: #fdfbf6; border-radius: 0 0 20px 20px; padding: 0 32px 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #e9ecf2; padding-top: 16px;">
              <tr>
                <td>
                  <table role="presentation" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="vertical-align: middle; padding-right: 6px;">
                        <img src="${origin}/favicon.png" width="18" height="18" alt="" style="display: block; border-radius: 50%;" />
                      </td>
                      <td style="vertical-align: middle;">
                        <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 13px; font-weight: 700; color: #101d33;">AUDAX <span style="color: #be5a1e;">HQ</span></span>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 6px 0 0; font-size: 12px; color: #7c8aa3;">The Business Operating System for Service Businesses.</p>
                </td>
              </tr>
              <tr>
                <td style="padding-top: 16px; font-size: 11px; color: #aeb8cb;">&copy; ${new Date().getFullYear()} Audax Ventures Inc. All rights reserved.</td>
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
      subject: "Reset your Audax HQ passcode",
      html,
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
 * the same static /demodashboardweb.png used in the in-app welcome popup
 * (see src/components/WelcomeModal.tsx) — regenerate it there if the app's
 * look changes.
 */
export async function sendWelcomeEmail(to: string, ownerName: string, businessName: string, appUrl: string): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL || "Audax HQ <onboarding@resend.dev>";
  const firstName = ownerName.trim().split(/\s+/)[0] || ownerName;
  const origin = new URL(appUrl).origin;
  const previewImageUrl = `${origin}/demodashboardweb.png`;
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
    <div style="background: #f0e6d2; padding: 24px 8px; font-family: Helvetica, Arial, sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 660px; margin: 0 auto;">
        <tr>
          <td style="border-radius: 20px 20px 0 0; overflow: hidden; background: linear-gradient(135deg, #101d33, #182b4a);">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding: 28px 32px; vertical-align: middle;">
                  <img src="${origin}/hqlogo.png" width="200" height="53" alt="Audax HQ" style="display: block;" />
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

/** Sent when someone submits the marketing site's contact form — lands in the shared support inbox with reply_to set to the submitter, so replying goes straight to them. */
export async function sendContactFormEmail(name: string, fromEmail: string, message: string): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL || "Audax HQ <onboarding@resend.dev>";
  const supportEmail = "info@audaxventures.ca";

  const escapedMessage = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />");

  const html = `
    <div style="font-family: Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h1 style="margin: 0 0 16px; font-family: Georgia, 'Times New Roman', serif; font-size: 20px; color: #101d33;">New contact form submission</h1>
      <p style="margin: 0 0 4px; font-size: 14px; color: #4c5f82;"><strong style="color: #101d33;">From:</strong> ${name} &lt;${fromEmail}&gt;</p>
      <p style="margin: 16px 0 4px; font-size: 14px; color: #4c5f82;"><strong style="color: #101d33;">Message:</strong></p>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #101d33; white-space: pre-wrap;">${escapedMessage}</p>
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
      to: supportEmail,
      reply_to: fromEmail,
      subject: `Contact form: ${name}`,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to send contact form email (${res.status}): ${body || res.statusText}`);
  }
}
