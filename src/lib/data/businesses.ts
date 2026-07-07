import { sql } from "@/lib/db";
import { supabase, BUSINESS_ASSETS_BUCKET } from "@/lib/storage";
import { todayInTimezone } from "@/lib/timezone";
import type { Business } from "@/lib/types";

function mapBusiness(row: Record<string, unknown>): Business {
  const logoPath = row.logo_path as string | null;
  return {
    id: row.id as string,
    name: row.name as string,
    ownerName: row.owner_name as string,
    ownerEmail: row.owner_email as string,
    timezone: row.timezone as string,
    logoUrl: logoPath ? supabase.storage.from(BUSINESS_ASSETS_BUCKET).getPublicUrl(logoPath).data.publicUrl : null,
    invoiceAgingUnderDays: Number(row.invoice_aging_under_days),
    invoiceAgingOverDays: Number(row.invoice_aging_over_days),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getBusiness(businessId: string): Promise<Business> {
  const rows = await sql`select * from businesses where id = ${businessId}`;
  return mapBusiness(rows[0] as Record<string, unknown>);
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
