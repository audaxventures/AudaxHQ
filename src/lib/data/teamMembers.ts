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

export async function listTeamMembers(opts: { includeInactive?: boolean } = {}): Promise<TeamMember[]> {
  const rows = opts.includeInactive
    ? await sql`select * from team_members order by active desc, name asc`
    : await sql`select * from team_members where active order by name asc`;
  return rows.map((r) => mapTeamMember(r as Record<string, unknown>));
}

export async function getTeamMember(id: string): Promise<TeamMember | null> {
  const rows = await sql`select * from team_members where id = ${id}`;
  return rows[0] ? mapTeamMember(rows[0] as Record<string, unknown>) : null;
}

export interface TeamMemberInput {
  name: string;
  defaultHourlyRate: number;
}

export async function createTeamMember(input: TeamMemberInput): Promise<TeamMember> {
  const rows = await sql`
    insert into team_members (name, default_hourly_rate)
    values (${input.name}, ${input.defaultHourlyRate})
    returning *
  `;
  return mapTeamMember(rows[0] as Record<string, unknown>);
}

export async function updateTeamMember(id: string, input: TeamMemberInput): Promise<void> {
  await sql`
    update team_members set name = ${input.name}, default_hourly_rate = ${input.defaultHourlyRate}
    where id = ${id}
  `;
}

export async function setTeamMemberActive(id: string, active: boolean): Promise<void> {
  await sql`update team_members set active = ${active} where id = ${id}`;
}

export interface TeamMemberCredentials {
  id: string;
  hash: string;
  salt: string;
  active: boolean;
}

export async function getTeamMemberIdByEmail(email: string): Promise<string | null> {
  const rows = await sql`select id from team_members where email = ${email} and passcode_hash is not null`;
  const row = rows[0] as Record<string, unknown> | undefined;
  return row ? (row.id as string) : null;
}

export async function getTeamMemberCredentialsByEmail(email: string): Promise<TeamMemberCredentials | null> {
  const rows = await sql`
    select id, passcode_hash, passcode_salt, active from team_members
    where email = ${email} and passcode_hash is not null
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

/** Gives a team member their first login credentials (or replaces existing ones outright). */
export async function setTeamMemberLogin(id: string, email: string, passcode: string): Promise<void> {
  const { hash, salt } = hashPasscode(passcode);
  await sql`
    update team_members
    set email = ${email}, passcode_hash = ${hash}, passcode_salt = ${salt},
        passcode_reset_token_hash = null, passcode_reset_token_expires_at = null
    where id = ${id}
  `;
}

export async function removeTeamMemberLogin(id: string): Promise<void> {
  await sql`
    update team_members
    set email = null, passcode_hash = null, passcode_salt = null,
        passcode_reset_token_hash = null, passcode_reset_token_expires_at = null
    where id = ${id}
  `;
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
