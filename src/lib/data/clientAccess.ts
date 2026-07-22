import { sql } from "@/lib/db";
import type { CurrentUser } from "@/lib/types";

export async function getClientAccessIds(teamMemberId: string, businessId: string): Promise<string[]> {
  const rows = await sql`select client_id from client_access where team_member_id = ${teamMemberId} and business_id = ${businessId}`;
  return rows.map((r) => (r as Record<string, unknown>).client_id as string);
}

/** Null = no restriction (owner sees everything). Non-null = the exact client IDs a team member may see. */
export async function accessibleClientIdsFor(user: CurrentUser): Promise<string[] | null> {
  if (user.role === "OWNER") return null;
  return getClientAccessIds(user.teamMember.id, user.businessId);
}

/** All client-access grants, grouped by team member — one query for the whole Settings > Team Members list. */
export async function listAllClientAccess(businessId: string): Promise<Record<string, string[]>> {
  const rows = await sql`select team_member_id, client_id from client_access where business_id = ${businessId}`;
  const map: Record<string, string[]> = {};
  for (const row of rows as Record<string, unknown>[]) {
    const teamMemberId = row.team_member_id as string;
    (map[teamMemberId] ??= []).push(row.client_id as string);
  }
  return map;
}

/** Replaces a team member's full client-access list in one shot (delete-then-insert, matching this codebase's tag-management pattern). */
export async function setClientAccess(teamMemberId: string, businessId: string, clientIds: string[]): Promise<void> {
  await sql`delete from client_access where team_member_id = ${teamMemberId} and business_id = ${businessId}`;
  if (clientIds.length === 0) return;
  for (const clientId of clientIds) {
    await sql`insert into client_access (team_member_id, client_id, business_id) values (${teamMemberId}, ${clientId}, ${businessId})`;
  }
}

/** Grants a freshly-created client to a set of team members in one shot — the New Client form's "Give access to" checklist, so the owner doesn't have to remember a separate trip to Settings. Safe to call with an empty list (no-op). */
export async function grantClientAccess(clientId: string, businessId: string, teamMemberIds: string[]): Promise<void> {
  for (const teamMemberId of teamMemberIds) {
    await sql`insert into client_access (team_member_id, client_id, business_id) values (${teamMemberId}, ${clientId}, ${businessId})`;
  }
}
