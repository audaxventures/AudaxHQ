import { sql } from "@/lib/db";

export async function getClientAccessIds(teamMemberId: string): Promise<string[]> {
  const rows = await sql`select client_id from client_access where team_member_id = ${teamMemberId}`;
  return rows.map((r) => (r as Record<string, unknown>).client_id as string);
}

/** All client-access grants, grouped by team member — one query for the whole Settings > Team Members list. */
export async function listAllClientAccess(): Promise<Record<string, string[]>> {
  const rows = await sql`select team_member_id, client_id from client_access`;
  const map: Record<string, string[]> = {};
  for (const row of rows as Record<string, unknown>[]) {
    const teamMemberId = row.team_member_id as string;
    (map[teamMemberId] ??= []).push(row.client_id as string);
  }
  return map;
}

/** Replaces a team member's full client-access list in one shot (delete-then-insert, matching this codebase's tag-management pattern). */
export async function setClientAccess(teamMemberId: string, clientIds: string[]): Promise<void> {
  await sql`delete from client_access where team_member_id = ${teamMemberId}`;
  if (clientIds.length === 0) return;
  for (const clientId of clientIds) {
    await sql`insert into client_access (team_member_id, client_id) values (${teamMemberId}, ${clientId})`;
  }
}
