import { sql } from "@/lib/db";
import { hashPasscode } from "@/lib/auth";
import type { TeamMember } from "@/lib/types";

function mapTeamMember(row: Record<string, unknown>): TeamMember {
  return {
    id: row.id as string,
    name: row.name as string,
    defaultHourlyRate: row.default_hourly_rate as string,
    active: row.active as boolean,
    createdAt: row.created_at as string,
    email: (row.email as string | null) ?? null,
    hasLogin: row.passcode_hash != null,
  };
}

export async function listTeamMembers(businessId: string, opts: { includeInactive?: boolean } = {}): Promise<TeamMember[]> {
  const rows = opts.includeInactive
    ? await sql`select * from team_members where business_id = ${businessId} order by active desc, name asc`
    : await sql`select * from team_members where business_id = ${businessId} and active order by name asc`;
  return rows.map((r) => mapTeamMember(r as Record<string, unknown>));
}

export async function getTeamMember(id: string, businessId: string): Promise<TeamMember | null> {
  const rows = await sql`select * from team_members where id = ${id} and business_id = ${businessId}`;
  return rows[0] ? mapTeamMember(rows[0] as Record<string, unknown>) : null;
}

export interface TeamMemberInput {
  name: string;
  defaultHourlyRate: number;
}

export async function createTeamMember(businessId: string, input: TeamMemberInput): Promise<TeamMember> {
  const rows = await sql`
    insert into team_members (business_id, name, default_hourly_rate)
    values (${businessId}, ${input.name}, ${input.defaultHourlyRate})
    returning *
  `;
  return mapTeamMember(rows[0] as Record<string, unknown>);
}

export async function updateTeamMember(id: string, businessId: string, input: TeamMemberInput): Promise<void> {
  await sql`
    update team_members set name = ${input.name}, default_hourly_rate = ${input.defaultHourlyRate}
    where id = ${id} and business_id = ${businessId}
  `;
}

export async function setTeamMemberActive(id: string, businessId: string, active: boolean): Promise<void> {
  await sql`update team_members set active = ${active} where id = ${id} and business_id = ${businessId}`;
}

/** Time entries are the one record type that never disappears silently — they feed cost/profitability reporting. */
export async function countTimeEntries(id: string, businessId: string): Promise<number> {
  const rows = await sql`
    select count(*)::int as count from time_entries where team_member_id = ${id} and business_id = ${businessId}
  `;
  return (rows[0] as Record<string, unknown>).count as number;
}

/**
 * Hard-deletes a team member. Every other record type they may be linked to
 * (todos, follow_ups, client_access, account_emails, businesses.owner_team_member_id)
 * already cascades or nulls out safely at the FK level. Callers must confirm
 * countTimeEntries(...) is 0 first — the FK on time_entries has no ON DELETE
 * clause specifically to make that check unavoidable rather than silently
 * dropping cost history.
 */
export async function deleteTeamMemberPermanently(id: string, businessId: string): Promise<void> {
  await sql`delete from team_members where id = ${id} and business_id = ${businessId}`;
}

export interface TeamMemberCredentials {
  id: string;
  hash: string;
  salt: string;
  active: boolean;
}

/** Used by the login flow once account_emails has already resolved which team member an email belongs to. */
export async function getTeamMemberCredentials(id: string): Promise<TeamMemberCredentials | null> {
  const rows = await sql`
    select id, passcode_hash, passcode_salt, active from team_members
    where id = ${id} and passcode_hash is not null
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: row.id as string,
    hash: row.passcode_hash as string,
    salt: row.passcode_salt as string,
    active: row.active as boolean,
  };
}

/**
 * Gives a team member their first login credentials (or replaces existing
 * ones outright). Keeps account_emails in sync atomically — it's the
 * global login-resolution index, so it must never observe a team member
 * with a stale or missing email.
 */
export async function setTeamMemberLogin(id: string, businessId: string, email: string, passcode: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const { hash, salt } = hashPasscode(passcode);
  await sql.transaction([
    sql`
      update team_members
      set email = ${normalizedEmail}, passcode_hash = ${hash}, passcode_salt = ${salt},
          passcode_reset_token_hash = null, passcode_reset_token_expires_at = null
      where id = ${id}
    `,
    sql`delete from account_emails where team_member_id = ${id}`,
    sql`insert into account_emails (email, business_id, role, team_member_id) values (${normalizedEmail}, ${businessId}, 'TEAM_MEMBER', ${id})`,
  ]);
}

export async function removeTeamMemberLogin(id: string, businessId: string): Promise<void> {
  await sql.transaction([
    sql`
      update team_members
      set email = null, passcode_hash = null, passcode_salt = null,
          passcode_reset_token_hash = null, passcode_reset_token_expires_at = null
      where id = ${id} and business_id = ${businessId}
    `,
    sql`delete from account_emails where team_member_id = ${id}`,
  ]);
}

export async function setTeamMemberPasscode(id: string, passcode: string): Promise<void> {
  const { hash, salt } = hashPasscode(passcode);
  await sql`
    update team_members
    set passcode_hash = ${hash}, passcode_salt = ${salt},
        passcode_reset_token_hash = null, passcode_reset_token_expires_at = null
    where id = ${id}
  `;
}

export async function setTeamMemberResetToken(id: string, tokenHash: string, expiresAt: Date): Promise<void> {
  await sql`
    update team_members
    set passcode_reset_token_hash = ${tokenHash}, passcode_reset_token_expires_at = ${expiresAt.toISOString()}
    where id = ${id}
  `;
}

export async function clearTeamMemberResetToken(id: string): Promise<void> {
  await sql`
    update team_members
    set passcode_reset_token_hash = null, passcode_reset_token_expires_at = null
    where id = ${id}
  `;
}

export async function findTeamMemberByResetTokenHash(tokenHash: string): Promise<{ id: string } | null> {
  const rows = await sql`
    select id from team_members
    where passcode_reset_token_hash = ${tokenHash} and passcode_reset_token_expires_at > now()
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  return row ? { id: row.id as string } : null;
}
