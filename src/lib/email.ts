// Thin, dependency-free wrapper over Resend's REST API — just a couple of
// transactional emails are sent today, so a full SDK isn't worth the extra
// dependency.

import { appPath, APP_URL } from "@/lib/site";

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
  const from = process.env.RESEND_FROM_EMAIL || "Verclara <onboarding@resend.dev>";
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
                        <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 17px; font-weight: 700; color: #101d33;">Verclara</span>
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
                  <h1 style="margin: 0 0 12px; font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: 600; color: #101d33; line-height: 1.2;">Reset your Verclara password</h1>
                  <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #4c5f82;">We received a request to reset the password for your workspace.</p>
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
            <p style="margin: 0 0 8px; font-size: 15px; line-height: 1.6; color: #4c5f82;">You can reset your password by clicking the button below.</p>
            <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #4c5f82;">This link will expire in <span style="font-weight: 700; color: #be5a1e;">30 minutes</span> for your security.</p>

            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
              <tr>
                <td style="border-radius: 10px; background: #101d33;">
                  <a href="${resetUrl}" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; color: #fdfbf6; text-decoration: none;">Reset my password &rarr;</a>
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
                          If you didn't request a password reset, you can safely ignore this email. Your password won't change unless you use the link above.
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
                        <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 13px; font-weight: 700; color: #101d33;">Verclara</span>
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
      subject: "Reset your Verclara password",
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to send reset email (${res.status}): ${body || res.statusText}`);
  }
}

/**
 * Sent when an owner invites a team member to set up their own login —
 * reuses the same reset-passcode link/page/action as "forgot passcode"
 * (see sendPasscodeResetEmail), just framed as a first-time setup instead
 * of a reset, with a longer-lived link since an invite may sit unread
 * longer than a password-reset request would.
 */
export async function sendTeamMemberInviteEmail(
  to: string,
  memberName: string,
  businessName: string,
  inviteUrl: string
): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL || "Verclara <onboarding@resend.dev>";
  const firstName = memberName.trim().split(/\s+/)[0] || memberName;
  const origin = new URL(inviteUrl).origin;
  const supportEmail = "info@audaxventures.ca";
  const supportMailto = `mailto:${supportEmail}`;

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
                        <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 17px; font-weight: 700; color: #101d33;">Verclara</span>
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
            <span style="display: inline-block; width: 44px; height: 44px; line-height: 44px; text-align: center; border-radius: 50%; background: #ffffff; font-size: 20px; margin-bottom: 16px;">&#128075;</span>
            <h1 style="margin: 0 0 12px; font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: 600; color: #101d33; line-height: 1.2;">You're invited to ${businessName}</h1>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #4c5f82;">Set up your password to get into your team's Verclara workspace.</p>
          </td>
        </tr>
        <tr>
          <td style="background: #ffffff; padding: 32px;">
            <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.6; color: #101d33;">Hi <span style="font-weight: 700;">${firstName}</span>,</p>
            <p style="margin: 0 0 8px; font-size: 15px; line-height: 1.6; color: #4c5f82;"><span style="font-weight: 700;">${businessName}</span> has added you as a team member on Verclara. Click below to choose your own password and sign in.</p>
            <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #4c5f82;">This link will expire in <span style="font-weight: 700; color: #be5a1e;">7 days</span>.</p>

            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
              <tr>
                <td style="border-radius: 10px; background: #101d33;">
                  <a href="${inviteUrl}" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; color: #fdfbf6; text-decoration: none;">Set up my password &rarr;</a>
                </td>
              </tr>
            </table>

            <p style="margin: 0 0 4px; font-size: 12px; color: #7c8aa3;">Or copy and paste this link into your browser:</p>
            <p style="margin: 0 0 24px; font-size: 12px; word-break: break-all;">
              <a href="${inviteUrl}" style="color: #2f6f9e; text-decoration: underline;">${inviteUrl}</a>
            </p>
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
                        <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 13px; font-weight: 700; color: #101d33;">Verclara</span>
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
      subject: `You're invited to ${businessName} on Verclara`,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to send invite email (${res.status}): ${body || res.statusText}`);
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
  const from = process.env.RESEND_FROM_EMAIL || "Verclara <onboarding@resend.dev>";
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
                  <img src="${origin}/hqlogo.png" width="200" height="66" alt="Verclara" style="display: block;" />
                  <p style="margin: 8px 0 0; font-size: 13px; color: #b7c2d9; letter-spacing: 0.01em;">Your business command centre</p>
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
            <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #4c5f82;">${businessName} is ready to go — here's a quick map to get you moving fast.</p>

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
                  <a href="${appUrl}" style="display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 600; color: #fdfbf6; text-decoration: none;">Open Verclara &rarr;</a>
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
                  <span style="font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 14px; color: #4c5f82;">The Verclara Team</span>
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
      subject: "Welcome to Verclara — here's how to get started",
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to send welcome email (${res.status}): ${body || res.statusText}`);
  }
}

/** Sent when someone submits the marketing site's contact form — lands in Joshua's inbox with reply_to set to the submitter, so replying goes straight to them. */
export async function sendContactFormEmail(name: string, fromEmail: string, message: string): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL || "Verclara <onboarding@resend.dev>";
  const supportEmail = "joshua@audaxventures.ca";

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

export type NotificationEmailType = "TASK_ASSIGNED" | "FOLLOW_UP_ASSIGNED" | "MENTION";

const NOTIFICATION_EMAIL_CONFIG: Record<
  NotificationEmailType,
  { icon: string; iconBg: string; iconFg: string; eyebrow: string; subject: string }
> = {
  TASK_ASSIGNED: {
    icon: "&#10003;",
    iconBg: "#e1ebe2",
    iconFg: "#3f6c4c",
    eyebrow: "New task assigned",
    subject: "You've been assigned a task",
  },
  FOLLOW_UP_ASSIGNED: {
    icon: "&#9873;",
    iconBg: "#f2e4c6",
    iconFg: "#a87423",
    eyebrow: "New follow-up assigned",
    subject: "You've been assigned a follow-up",
  },
  MENTION: {
    icon: "@",
    iconBg: "#ede9fe",
    iconFg: "#7c3aed",
    eyebrow: "You were mentioned",
    subject: "You were mentioned in a note",
  },
};

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * The shared template behind every "assigned to you" / "mentioned you"
 * email — see notifyTaskAssignee/notifyFollowUpAssignee/notifyMentionedTeamMembers
 * (actions/tasks.ts, actions/followups.ts, (app)/clients|leads|partners/actions.ts)
 * for the callers, all routed through createNotification()
 * (lib/data/notifications.ts) so this only has to be wired up in one place.
 * `message` is the same human-readable sentence already stored on the
 * in-app notification row, so the email and the bell icon never say
 * different things about the same event.
 */
export async function sendNotificationEmail(params: {
  to: string;
  recipientName: string;
  type: NotificationEmailType;
  message: string;
  link: string;
}): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL || "Verclara <onboarding@resend.dev>";
  const firstName = params.recipientName.trim().split(/\s+/)[0] || params.recipientName;
  const config = NOTIFICATION_EMAIL_CONFIG[params.type];
  const actionUrl = appPath(params.link);
  const preferencesUrl = appPath("/settings/notifications");
  const supportEmail = "info@audaxventures.ca";

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
                        <img src="${APP_URL}/favicon.png" width="24" height="24" alt="" style="display: block; border-radius: 50%;" />
                      </td>
                      <td style="vertical-align: middle;">
                        <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 17px; font-weight: 700; color: #101d33;">Verclara</span>
                      </td>
                    </tr>
                  </table>
                </td>
                <td style="text-align: right; font-size: 13px; color: #4c5f82;">
                  Need help? <a href="mailto:${supportEmail}" style="color: #be5a1e; text-decoration: none; font-weight: 600;">Contact our team &rarr;</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background: #ffffff; padding: 8px 32px 32px;">
            <p style="margin: 0 0 16px; font-size: 15px; color: #101d33;">Hi <span style="font-weight: 700;">${escapeHtml(firstName)}</span>,</p>

            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: #f7f5f0; border-radius: 14px;">
              <tr>
                <td style="padding: 24px;">
                  <table role="presentation" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width: 44px; vertical-align: top;">
                        <span style="display: inline-block; width: 36px; height: 36px; line-height: 36px; text-align: center; border-radius: 50%; background: ${config.iconBg}; color: ${config.iconFg}; font-size: 16px; font-weight: 700;">${config.icon}</span>
                      </td>
                      <td style="vertical-align: top; padding-left: 6px;">
                        <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: ${config.iconFg};">${config.eyebrow}</p>
                        <p style="margin: 0; font-size: 15px; line-height: 1.55; color: #101d33;">${escapeHtml(params.message)}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
              <tr>
                <td style="border-radius: 10px; background: #101d33;">
                  <a href="${actionUrl}" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; color: #fdfbf6; text-decoration: none;">View in Verclara &rarr;</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background: #fdfbf6; padding: 20px 32px;">
            <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #aeb8cb;">
              You're receiving this because email notifications are on for this event type.
              <a href="${preferencesUrl}" style="color: #7c8aa3; text-decoration: underline;">Manage your notification preferences</a>.
            </p>
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
                        <img src="${APP_URL}/favicon.png" width="18" height="18" alt="" style="display: block; border-radius: 50%;" />
                      </td>
                      <td style="vertical-align: middle;">
                        <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 13px; font-weight: 700; color: #101d33;">Verclara</span>
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
      to: params.to,
      subject: config.subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to send notification email (${res.status}): ${body || res.statusText}`);
  }
}

/**
 * Short, specific lines for the Daily Brief's masthead — upbeat and
 * motivating (this is the first thing someone reads each morning), but
 * still grounded in the actual work of running a client-facing service
 * business rather than generic "you've got this" filler. One is picked
 * deterministically by date (a simple hash of the YYYY-MM-DD string, not
 * Math.random()) so the same day always shows the same line — different
 * daily, reproducible for testing, no stored state needed.
 */
const DAILY_BRIEF_LINES = [
  "Every task you clear today is one less thing between you and the work you actually want to be doing.",
  "The clients who trust you most have watched you follow through, again and again — today's another one of those days.",
  "Small wins add up fast. Today's list is full of them.",
  "There's real satisfaction in a job followed all the way through — today's a good day to feel it.",
  "You've built something real, and every day you show up for it, it gets a little stronger.",
  "Momentum feels good. All it takes is finishing the next thing.",
  "Being the person people can count on is a genuine edge — and you're building it again today.",
  "A clear list today makes for a lighter week tomorrow.",
  "The work you finish today is the reputation you're building for next year.",
  "Today's a fresh start, and everything on this list is within reach.",
];

function dailyBriefLineFor(dateKey: string): string {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) hash = (hash * 31 + dateKey.charCodeAt(i)) | 0;
  return DAILY_BRIEF_LINES[Math.abs(hash) % DAILY_BRIEF_LINES.length];
}

function formatBriefDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** Masthead dateline — "TUESDAY, AUGUST 18", the newsletter-issue-date convention this template borrows from print. */
function formatBriefDateline(iso: string): string {
  return new Date(`${iso}T00:00:00Z`)
    .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    .toUpperCase();
}

export interface DailyBriefEmailItem {
  label: string;
  link: string;
  dueDate: string;
}

/** display:inline-block circle badge, same construction sendWelcomeEmail's numbered steps use — email clients don't support flexbox, so centering relies on a fixed line-height instead. */
function briefBadge(char: string, bg: string, fg: string): string {
  return `<span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; background: ${bg}; color: ${fg}; font-size: 11px; font-weight: 700; vertical-align: middle;">${char}</span>`;
}

function briefSectionLabel(char: string, title: string, color: { bg: string; fg: string }): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px 0 10px;">
      <tr>
        <td style="vertical-align: middle;">${briefBadge(char, color.bg, color.fg)}</td>
        <td style="vertical-align: middle; padding-left: 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: ${color.fg};">${title}</td>
      </tr>
    </table>
  `;
}

/**
 * Every user's morning summary — one call per recipient (see
 * api/cron/daily-brief/route.ts, which fans this out to every opted-in
 * user across every business whose local morning it currently is). Always
 * sends, even with nothing overdue or due today: an empty list still gets
 * the masthead line, the "upcoming" preview if there is one, and a nudge
 * to check in, rather than silence that could as easily mean "broken" as
 * "nothing to do." Styled to match sendWelcomeEmail's newsletter-like
 * treatment (dark masthead, serif headline, list rows with chevrons) since
 * this is the one email in the app someone sees daily, not just once —
 * it earns the same visual investment as the first-run welcome does.
 */
export async function sendDailyBriefEmail(params: {
  to: string;
  recipientName: string;
  today: string;
  overdue: DailyBriefEmailItem[];
  dueToday: DailyBriefEmailItem[];
  upcoming: DailyBriefEmailItem[];
  recentActivity: string[];
  recentActivityCount: number;
}): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL || "Verclara <onboarding@resend.dev>";
  const firstName = params.recipientName.trim().split(/\s+/)[0] || params.recipientName;
  const dashboardUrl = appPath("/");
  const preferencesUrl = appPath("/settings/notifications");
  const supportEmail = "info@audaxventures.ca";
  const hasUrgent = params.overdue.length > 0 || params.dueToday.length > 0;

  const subject = hasUrgent
    ? [
        params.overdue.length > 0 ? `${params.overdue.length} overdue` : null,
        params.dueToday.length > 0 ? `${params.dueToday.length} due today` : null,
      ]
        .filter(Boolean)
        .join(", ")
    : "nothing due today";

  function itemsSection(title: string, char: string, color: { bg: string; fg: string }, items: DailyBriefEmailItem[], showDate: boolean): string {
    if (items.length === 0) return "";
    const rows = items
      .map(
        (item, i) => `
          <tr>
            <td style="padding: 13px 0; ${i > 0 ? "border-top: 1px solid #eceae3;" : ""}">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="width: 4px; background: ${color.fg}; border-radius: 2px;">&nbsp;</td>
                  <td style="padding-left: 12px;">
                    <a href="${appPath(item.link)}" style="font-size: 14.5px; font-weight: 500; color: #101d33; text-decoration: none;">${escapeHtml(item.label)}</a>
                    ${showDate ? `<span style="display: block; margin-top: 2px; font-size: 12px; color: #aeb8cb;">${formatBriefDate(item.dueDate)}</span>` : ""}
                  </td>
                  <td style="width: 16px; text-align: right; font-size: 15px; color: #c7cedb;">&rsaquo;</td>
                </tr>
              </table>
            </td>
          </tr>
        `
      )
      .join("");
    return `
      ${briefSectionLabel(char, title, color)}
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rows}</table>
    `;
  }

  const nudgeHtml = !hasUrgent
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: #f7f5f0; border-radius: 14px; margin-top: 22px;">
        <tr>
          <td style="padding: 20px 22px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width: 40px; vertical-align: top;">${briefBadge("&#9728;", "#e9ecf2", "#4c5f82")}</td>
                <td style="vertical-align: top; padding-left: 4px; font-size: 14.5px; line-height: 1.6; color: #101d33;">
                  Nothing's tagged for you today. Head into Verclara, check in on your open tasks, and keep things moving.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
    : "";

  const overdueHtml = itemsSection("Overdue", "!", { bg: "#f2dbd6", fg: "#a23f30" }, params.overdue, false);
  const dueTodayHtml = itemsSection("Due today", "&#8226;", { bg: "#f2e4c6", fg: "#a87423" }, params.dueToday, false);
  const upcomingHtml = itemsSection("Upcoming", "&raquo;", { bg: "#dceaf2", fg: "#2f6f9e" }, params.upcoming, true);

  const shownActivity = params.recentActivity.slice(0, 3);
  const moreActivity = params.recentActivityCount - shownActivity.length;
  const activityHtml =
    shownActivity.length > 0
      ? `
        <p style="margin: 28px 0 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #7c8aa3;">Since yesterday</p>
        <ul style="margin: 0; padding: 0 0 0 20px; font-size: 13.5px; line-height: 1.8; color: #4c5f82;">
          ${shownActivity.map((m) => `<li>${escapeHtml(m)}</li>`).join("")}
          ${moreActivity > 0 ? `<li>+${moreActivity} more</li>` : ""}
        </ul>
      `
      : "";

  const html = `
    <div style="background: #f0e6d2; padding: 24px 8px; font-family: Helvetica, Arial, sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; margin: 0 auto;">
        <tr>
          <td style="border-radius: 20px 20px 0 0; overflow: hidden; background: linear-gradient(135deg, #101d33, #182b4a); padding: 30px 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="vertical-align: middle;">
                  <img src="${APP_URL}/hqlogo.png" width="160" height="53" alt="Verclara" style="display: block;" />
                </td>
                <td style="vertical-align: middle; text-align: right; font-size: 11px; font-weight: 600; letter-spacing: 0.05em; color: #8291ac;">
                  ${formatBriefDateline(params.today)}
                </td>
              </tr>
            </table>
            <p style="margin: 22px 0 0; font-family: Georgia, 'Times New Roman', serif; font-size: 23px; font-weight: 600; color: #fdfbf6;">Your Daily Brief</p>
            <p style="margin: 14px 0 0; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.14); font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 14.5px; line-height: 1.55; color: #b7c2d9;">
              &ldquo;${dailyBriefLineFor(params.today)}&rdquo;
            </p>
          </td>
        </tr>
        <tr>
          <td style="background: #ffffff; padding: 32px;">
            <h1 style="margin: 0 0 10px; font-family: Georgia, 'Times New Roman', serif; font-size: 25px; font-weight: 600; color: #101d33;">Good morning, ${escapeHtml(firstName)}.</h1>
            <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #4c5f82;">
              Here's where things stand before you dive in — what's overdue, what's due today, and what's coming up next, so you can start with a plan instead of a scramble.
            </p>

            ${nudgeHtml}
            ${overdueHtml}
            ${dueTodayHtml}
            ${upcomingHtml}
            ${activityHtml}

            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
              <tr>
                <td style="border-radius: 10px; background: #be5a1e;">
                  <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; color: #fdfbf6; text-decoration: none;">Open Verclara &rarr;</a>
                </td>
                <td style="padding-left: 14px; font-size: 13px; color: #7c8aa3;">Everything above is one click away.</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background: #fdfbf6; padding: 28px 32px 8px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="width: 40px; vertical-align: top;">
                  <span style="display: inline-block; width: 32px; height: 32px; line-height: 32px; text-align: center; border-radius: 50%; background: #101d33; color: #fdfbf6; font-size: 14px;">&#9742;</span>
                </td>
                <td style="vertical-align: top; padding-left: 6px;">
                  <p style="margin: 0 0 4px; font-size: 13px; font-weight: 700; color: #101d33;">However today goes, we're glad you're keeping things moving.</p>
                  <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #7c8aa3;">
                    Questions or feedback? Email
                    <a href="mailto:${supportEmail}" style="color: #be5a1e; text-decoration: none;">${supportEmail}</a>.
                  </p>
                </td>
                <td style="vertical-align: bottom; text-align: right; padding-left: 12px; white-space: nowrap;">
                  <span style="font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 14px; color: #4c5f82;">The Verclara Team</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background: #fdfbf6; padding: 16px 32px 0;">
            <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #aeb8cb;">
              You're receiving this because your Daily Brief is on.
              <a href="${preferencesUrl}" style="color: #7c8aa3; text-decoration: underline;">Manage your notification preferences</a>.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background: #fdfbf6; border-radius: 0 0 20px 20px; padding: 16px 32px 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #e9ecf2; padding-top: 14px;">
              <tr>
                <td style="font-size: 11px; color: #aeb8cb;">&copy; ${new Date().getFullYear()} Audax Ventures Inc. All rights reserved.</td>
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
      to: params.to,
      subject: `Your Daily Brief: ${subject}`,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to send daily brief email (${res.status}): ${body || res.statusText}`);
  }
}

/**
 * Sends a meeting note's branded PDF to a client/lead contact. `bodyText` is
 * the sender's own editable message (plain text, from the compose drawer —
 * see MeetingNoteEmailDrawer.tsx), escaped and line-broken into simple HTML.
 * `cc`/`replyTo` point back at whoever sent it, so they get a copy and any
 * reply lands in their own inbox rather than a generic sender address.
 */
export async function sendMeetingNotePdfEmail(params: {
  to: string;
  cc?: string | null;
  replyTo?: string | null;
  senderName: string;
  businessName: string;
  subject: string;
  bodyText: string;
  attachmentFilename: string;
  attachmentBase64: string;
}): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL || "Verclara <onboarding@resend.dev>";

  const escapedBody = params.bodyText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />");

  const html = `
    <div style="font-family: Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #101d33;">
      <p style="margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escapedBody}</p>
      <p style="margin: 24px 0 0; font-size: 13px; color: #7c8aa3;">${params.senderName} &middot; ${params.businessName}</p>
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
      to: params.to,
      ...(params.cc ? { cc: params.cc } : {}),
      ...(params.replyTo ? { reply_to: params.replyTo } : {}),
      subject: params.subject,
      html,
      attachments: [{ filename: params.attachmentFilename, content: params.attachmentBase64 }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to send meeting note email (${res.status}): ${body || res.statusText}`);
  }
}
