import { randomUUID } from "crypto";
import { sql } from "@/lib/db";
import { supabase, BUSINESS_ASSETS_BUCKET } from "@/lib/storage";
import { todayInTimezone } from "@/lib/timezone";
import type { Business, BillingInterval, SubscriptionStatus } from "@/lib/types";

function mapBusiness(row: Record<string, unknown>): Business {
  const logoPath = row.logo_path as string | null;
  return {
    id: row.id as string,
    name: row.name as string,
    ownerName: row.owner_name as string,
    ownerEmail: row.owner_email as string,
    ownerTeamMemberId: row.owner_team_member_id as string | null,
    timezone: row.timezone as string,
    logoUrl: logoPath ? supabase.storage.from(BUSINESS_ASSETS_BUCKET).getPublicUrl(logoPath).data.publicUrl : null,
    invoiceAgingUnderDays: Number(row.invoice_aging_under_days),
    invoiceAgingOverDays: Number(row.invoice_aging_over_days),
    suspendedAt: row.suspended_at as string | null,
    onboardingDismissedAt: row.onboarding_dismissed_at as string | null,
    tier: row.tier as Business["tier"],
    stripeCustomerId: row.stripe_customer_id as string | null,
    stripeSubscriptionId: row.stripe_subscription_id as string | null,
    subscriptionStatus: row.subscription_status as SubscriptionStatus | null,
    trialEndsAt: row.trial_ends_at as string | null,
    billingInterval: row.billing_interval as BillingInterval | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    ownerNotifyTaskAssigned: row.owner_notify_task_assigned as boolean,
    ownerNotifyFollowUpAssigned: row.owner_notify_followup_assigned as boolean,
    ownerNotifyMention: row.owner_notify_mention as boolean,
    ownerNotifyDailyBrief: row.owner_notify_daily_brief as boolean,
    dailyBriefSendHour: Number(row.daily_brief_send_hour),
    dailyBriefLastSentDate: row.daily_brief_last_sent_date as string | null,
  };
}

export async function getBusiness(businessId: string): Promise<Business> {
  const rows = await sql`select * from businesses where id = ${businessId}`;
  return mapBusiness(rows[0] as Record<string, unknown>);
}

export interface CreateBusinessInput {
  name: string;
  ownerName: string;
  /** Already normalized to lower(trim()) by the caller. */
  ownerEmail: string;
  passcodeHash: string;
  passcodeSalt: string;
  timezone: string;
}

/**
 * Creates a new tenant workspace: the business row, its account_emails
 * entry, a team_members row for the owner (linked back via
 * owner_team_member_id — see migration 022) so they can log their own
 * time entries and appear in Settings > Team Members immediately instead
 * of needing to add and link themselves manually, and a starter set of
 * lookup rows (work types, lead sources, to-do types) so the new owner
 * isn't dropped into an empty picklist everywhere. All in one transaction
 * — account_emails' primary key on email is what actually enforces global
 * email uniqueness (see lookupAccountEmail), so if the email is already
 * taken this whole transaction rolls back atomically and no orphan
 * business row is left behind. The business id and owner team_members id
 * are both generated here (rather than left to their columns' defaults)
 * so they can be reused across every statement in the batch, since
 * sql.transaction() can't reference an earlier statement's result from a
 * later one. The owner's team_members row is inserted before the
 * businesses.owner_team_member_id update (rather than in the same insert
 * as the business) because the two tables' foreign keys point at each
 * other and neither is deferrable.
 */
export async function createBusiness(input: CreateBusinessInput): Promise<Business> {
  const businessId = randomUUID();
  const ownerTeamMemberId = randomUUID();
  await sql.transaction([
    sql`
      insert into businesses (id, name, owner_name, owner_email, owner_passcode_hash, owner_passcode_salt, timezone)
      values (${businessId}, ${input.name}, ${input.ownerName}, ${input.ownerEmail}, ${input.passcodeHash}, ${input.passcodeSalt}, ${input.timezone})
    `,
    sql`insert into account_emails (email, business_id, role) values (${input.ownerEmail}, ${businessId}, 'OWNER')`,
    sql`insert into team_members (id, business_id, name) values (${ownerTeamMemberId}, ${businessId}, ${input.ownerName})`,
    sql`update businesses set owner_team_member_id = ${ownerTeamMemberId} where id = ${businessId}`,
    sql`
      insert into work_types (business_id, name, is_fallback) values
        (${businessId}, 'Consulting', false),
        (${businessId}, 'Other', true)
    `,
    sql`
      insert into lead_sources (business_id, name, is_fallback) values
        (${businessId}, 'Referral', false),
        (${businessId}, 'Cold Outreach', false),
        (${businessId}, 'Inbound', false),
        (${businessId}, 'Other', true)
    `,
    sql`
      insert into todo_types (business_id, name) values
        (${businessId}, 'General'),
        (${businessId}, 'Personal'),
        (${businessId}, 'Other')
    `,
  ]);
  return getBusiness(businessId);
}

/** The workspace's configured IANA timezone, used to compute "today" everywhere date-only logic needs it. */
export async function getBusinessTimezone(businessId: string): Promise<string> {
  const rows = await sql`select timezone from businesses where id = ${businessId}`;
  return (rows[0] as Record<string, unknown>)?.timezone as string;
}

/** "Today" as a YYYY-MM-DD string in the workspace's configured timezone — the standard entry point for server pages/actions that just need the current calendar day. */
export async function getBusinessToday(businessId: string): Promise<string> {
  return todayInTimezone(await getBusinessTimezone(businessId));
}

/**
 * Updates the owner's identity fields. Keeps `account_emails` in sync with
 * `owner_email` atomically (both statements submitted as one non-interactive
 * Postgres transaction) — account_emails is the global login-resolution
 * index, so it must never observe a business with a stale or missing email.
 */
export async function updateBusinessOwnerProfile(
  businessId: string,
  input: { ownerName: string; ownerEmail: string; timezone: string }
): Promise<void> {
  const ownerEmail = input.ownerEmail.trim().toLowerCase();
  await sql.transaction([
    sql`
      update businesses set owner_name = ${input.ownerName}, owner_email = ${ownerEmail}, timezone = ${input.timezone}, updated_at = now()
      where id = ${businessId}
    `,
    sql`
      update account_emails set email = ${ownerEmail}
      where business_id = ${businessId} and role = 'OWNER'
    `,
  ]);
}

export async function updateBusinessName(businessId: string, name: string): Promise<void> {
  await sql`update businesses set name = ${name}, updated_at = now() where id = ${businessId}`;
}

export interface OwnerNotificationPreferencesInput {
  ownerNotifyTaskAssigned: boolean;
  ownerNotifyFollowUpAssigned: boolean;
  ownerNotifyMention: boolean;
  ownerNotifyDailyBrief: boolean;
}

/** Self-service — the owner's own email notification preferences, set from Settings > Notifications (see (app)/settings/notifications/page.tsx). Mirrors updateTeamMemberNotificationPreferences for every other recipient. */
export async function updateOwnerNotificationPreferences(
  businessId: string,
  input: OwnerNotificationPreferencesInput
): Promise<void> {
  await sql`
    update businesses
    set owner_notify_task_assigned = ${input.ownerNotifyTaskAssigned},
        owner_notify_followup_assigned = ${input.ownerNotifyFollowUpAssigned},
        owner_notify_mention = ${input.ownerNotifyMention},
        owner_notify_daily_brief = ${input.ownerNotifyDailyBrief}
    where id = ${businessId}
  `;
}

/**
 * Every business whose local time has reached (or passed) its Daily Brief
 * send hour AND hasn't already had its brief sent today (in its own
 * timezone) — the candidate set the hourly cron trigger (see
 * api/cron/daily-brief) iterates. Computed with a straight SQL timezone
 * conversion rather than pulling every business into Node and checking
 * there, since this needs to run against every business's own IANA
 * timezone at once.
 *
 * Deliberately ">=" rather than "=" on the hour: GitHub Actions' `schedule`
 * trigger (see .github/workflows/daily-brief.yml) is best-effort and can
 * skip hours entirely under queue load, not just slip by a few minutes —
 * observed gaps between consecutive runs have run anywhere from ~2 to 8+
 * hours instead of the configured 1. An exact-hour match would silently
 * drop a business's brief for the day whenever its one matching hour got
 * skipped, with no way to catch up until the next day (and no guarantee
 * that hour wouldn't be skipped too). ">=" plus the daily_brief_last_sent_date
 * guard below makes this self-healing: whichever hour the cron actually
 * runs in next, it still catches anyone whose send hour has already passed
 * and hasn't been sent yet today, without ever double-sending.
 */
export async function listBusinessesDueForDailyBrief(): Promise<Business[]> {
  const rows = await sql`
    select * from businesses
    where suspended_at is null
      and extract(hour from now() at time zone timezone) >= daily_brief_send_hour
      and (daily_brief_last_sent_date is null or daily_brief_last_sent_date < (now() at time zone timezone)::date)
  `;
  return rows.map((r) => mapBusiness(r as Record<string, unknown>));
}

/** Marks today (in the business's own timezone) as the last date its Daily Brief batch went out — the guard listBusinessesDueForDailyBrief checks. */
export async function markDailyBriefSent(businessId: string): Promise<void> {
  await sql`
    update businesses
    set daily_brief_last_sent_date = (now() at time zone timezone)::date
    where id = ${businessId}
  `;
}

/** Marks the first-login welcome popup as seen — see migration 023. */
export async function dismissOnboarding(businessId: string): Promise<void> {
  await sql`update businesses set onboarding_dismissed_at = now() where id = ${businessId} and onboarding_dismissed_at is null`;
}

/** Links (or unlinks, with null) a team_members row as the owner's own identity — see migration 022. */
export async function setOwnerTeamMember(businessId: string, teamMemberId: string | null): Promise<void> {
  await sql`update businesses set owner_team_member_id = ${teamMemberId} where id = ${businessId}`;
}

/** Set once, right after signup — see createStripeCustomer in src/lib/stripe.ts. */
export async function setStripeCustomerId(businessId: string, stripeCustomerId: string): Promise<void> {
  await sql`update businesses set stripe_customer_id = ${stripeCustomerId} where id = ${businessId}`;
}

/**
 * The only writer of subscription state. Called from the Stripe webhook
 * handler (src/app/api/webhooks/stripe/route.ts) for every normal
 * subscription change, and once more from the free-coupon signup path
 * (src/app/signup/actions.ts) — that path can't wait on the webhook's
 * network round trip before redirecting into the app, so it syncs the
 * Stripe Subscription object it just created (not client-supplied data)
 * onto the business row itself. Never call this with status derived from
 * anything a client sent directly, since these fields gate access to the
 * app.
 */
export async function updateSubscriptionFromStripe(
  businessId: string,
  input: {
    stripeSubscriptionId: string;
    subscriptionStatus: SubscriptionStatus;
    tier: Business["tier"];
    billingInterval: BillingInterval;
    trialEndsAt: string | null;
  }
): Promise<void> {
  await sql`
    update businesses set
      stripe_subscription_id = ${input.stripeSubscriptionId},
      subscription_status = ${input.subscriptionStatus},
      tier = ${input.tier},
      billing_interval = ${input.billingInterval},
      trial_ends_at = ${input.trialEndsAt},
      updated_at = now()
    where id = ${businessId}
  `;
}

/** Looked up by the webhook handler, which only gets a Stripe customer/subscription id off the event payload — never a businessId directly. */
export async function findBusinessByStripeCustomerId(stripeCustomerId: string): Promise<{ id: string } | null> {
  const rows = await sql`select id from businesses where stripe_customer_id = ${stripeCustomerId}`;
  return rows.length > 0 ? { id: (rows[0] as Record<string, unknown>).id as string } : null;
}

/** Server-only (the logo upload/remove actions) — the raw storage path, needed to delete the previous file when replacing or removing the logo. */
export async function getBusinessLogoPath(businessId: string): Promise<string | null> {
  const rows = await sql`select logo_path from businesses where id = ${businessId}`;
  return ((rows[0] as Record<string, unknown>)?.logo_path as string | null) ?? null;
}

export async function setBusinessLogoPath(businessId: string, path: string | null): Promise<void> {
  await sql`update businesses set logo_path = ${path}, updated_at = now() where id = ${businessId}`;
}

export async function updateInvoiceAgingThresholds(businessId: string, underDays: number, overDays: number): Promise<void> {
  await sql`
    update businesses set invoice_aging_under_days = ${underDays}, invoice_aging_over_days = ${overDays}, updated_at = now()
    where id = ${businessId}
  `;
}

/** Server-only (auth.ts + the passcode-change action) — never expose these values to the client. */
export async function getPasscodeCredentials(businessId: string): Promise<{ hash: string; salt: string }> {
  const rows = await sql`select owner_passcode_hash, owner_passcode_salt from businesses where id = ${businessId}`;
  const row = rows[0] as Record<string, unknown>;
  return { hash: row.owner_passcode_hash as string, salt: row.owner_passcode_salt as string };
}

export async function setPasscodeCredentials(businessId: string, hash: string, salt: string): Promise<void> {
  await sql`
    update businesses set owner_passcode_hash = ${hash}, owner_passcode_salt = ${salt}, updated_at = now()
    where id = ${businessId}
  `;
}

/** Server-only (the forgot/reset-passcode actions) — a single-use, short-lived token, overwritten by each new reset request. */
export async function setPasscodeResetToken(businessId: string, tokenHash: string, expiresAt: Date): Promise<void> {
  await sql`
    update businesses set owner_passcode_reset_token_hash = ${tokenHash}, owner_passcode_reset_token_expires_at = ${expiresAt.toISOString()}
    where id = ${businessId}
  `;
}

export async function clearPasscodeResetToken(businessId: string): Promise<void> {
  await sql`
    update businesses set owner_passcode_reset_token_hash = null, owner_passcode_reset_token_expires_at = null
    where id = ${businessId}
  `;
}

/** Used by the reset-passcode flow to find which business a submitted token belongs to, without knowing the business up front. */
export async function findBusinessByResetTokenHash(tokenHash: string): Promise<{ id: string } | null> {
  const rows = await sql`
    select id from businesses
    where owner_passcode_reset_token_hash = ${tokenHash} and owner_passcode_reset_token_expires_at > now()
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  return row ? { id: row.id as string } : null;
}
