import { sql } from "@/lib/db";
import type { TeamMember } from "@/lib/types";

function mapTeamMember(row: Record<string, unknown>): TeamMember {
  return {
    id: row.id as string,
    name: row.name as string,
    defaultHourlyRate: row.default_hourly_rate as string,
    active: row.active as boolean,
    createdAt: row.created_at as string,
  };
}

export async function listTeamMembers(opts: { includeInactive?: boolean } = {}): Promise<TeamMember[]> {
  const rows = opts.includeInactive
    ? await sql`select * from team_members order by active desc, name asc`
    : await sql`select * from team_members where active order by name asc`;
  return rows.map((r) => mapTeamMember(r as Record<string, unknown>));
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
