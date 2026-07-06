import { sql } from "@/lib/db";
import { supabase, BUSINESS_ASSETS_BUCKET } from "@/lib/storage";
import type { AppSettings } from "@/lib/types";

export async function getAppSettings(): Promise<AppSettings> {
  const rows = await sql`select * from app_settings where id = true`;
  const row = rows[0] as Record<string, unknown>;
  const logoPath = row.logo_path as string | null;
  return {
    invoiceAgingUnderDays: Number(row.invoice_aging_under_days),
    invoiceAgingOverDays: Number(row.invoice_aging_over_days),
    hasCustomPasscode: row.passcode_hash !== null,
    logoUrl: logoPath ? supabase.storage.from(BUSINESS_ASSETS_BUCKET).getPublicUrl(logoPath).data.publicUrl : null,
  };
}

/** Server-only (the logo upload/remove actions) — the raw storage path, needed to delete the previous file when replacing or removing the logo. */
export async function getBusinessLogoPath(): Promise<string | null> {
  const rows = await sql`select logo_path from app_settings where id = true`;
  return ((rows[0] as Record<string, unknown>)?.logo_path as string | null) ?? null;
}

export async function setBusinessLogoPath(path: string | null): Promise<void> {
  await sql`update app_settings set logo_path = ${path}, updated_at = now() where id = true`;
}

export async function updateInvoiceAgingThresholds(underDays: number, overDays: number): Promise<void> {
  await sql`
    update app_settings set invoice_aging_under_days = ${underDays}, invoice_aging_over_days = ${overDays}, updated_at = now()
    where id = true
  `;
}

/** Server-only (auth.ts + the passcode-change action) — never expose these values to the client. */
export async function getPasscodeCredentials(): Promise<{ hash: string; salt: string } | null> {
  const rows = await sql`select passcode_hash, passcode_salt from app_settings where id = true`;
  const row = rows[0] as Record<string, unknown>;
  if (!row.passcode_hash || !row.passcode_salt) return null;
  return { hash: row.passcode_hash as string, salt: row.passcode_salt as string };
}

export async function setPasscodeCredentials(hash: string, salt: string): Promise<void> {
  await sql`
    update app_settings set passcode_hash = ${hash}, passcode_salt = ${salt}, updated_at = now()
    where id = true
  `;
}

/** Server-only (the forgot/reset-passcode actions) — a single-use, short-lived token, overwritten by each new reset request. */
export async function setPasscodeResetToken(tokenHash: string, expiresAt: Date): Promise<void> {
  await sql`
    update app_settings set passcode_reset_token_hash = ${tokenHash}, passcode_reset_token_expires_at = ${expiresAt.toISOString()}
    where id = true
  `;
}

export async function getPasscodeResetToken(): Promise<{ tokenHash: string; expiresAt: Date } | null> {
  const rows = await sql`select passcode_reset_token_hash, passcode_reset_token_expires_at from app_settings where id = true`;
  const row = rows[0] as Record<string, unknown>;
  if (!row.passcode_reset_token_hash || !row.passcode_reset_token_expires_at) return null;
  return {
    tokenHash: row.passcode_reset_token_hash as string,
    expiresAt: new Date(row.passcode_reset_token_expires_at as string),
  };
}

export async function clearPasscodeResetToken(): Promise<void> {
  await sql`
    update app_settings set passcode_reset_token_hash = null, passcode_reset_token_expires_at = null
    where id = true
  `;
}
