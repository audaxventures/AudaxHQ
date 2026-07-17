import { sql } from "@/lib/db";
import type { FollowUp, FollowUpStatus } from "@/lib/types";

interface FollowUpRow {
  id: string;
  client_id: string | null;
  lead_id: string | null;
  label: string;
  date: string;
  status: FollowUpStatus;
  created_at: string;
  updated_at: string;
  assigned_to_team_member_id: string | null;
}

function mapFollowUp(row: FollowUpRow): FollowUp {
  return {
    id: row.id,
    clientId: row.client_id,
    leadId: row.lead_id,
    label: row.label,
    date: row.date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    assignedToTeamMemberId: row.assigned_to_team_member_id,
  };
}

export async function listFollowUpsForClient(clientId: string, businessId: string): Promise<FollowUp[]> {
  const rows = await sql`
    select * from follow_ups where client_id = ${clientId} and business_id = ${businessId} order by date asc
  `;
  return (rows as unknown as FollowUpRow[]).map(mapFollowUp);
}

export async function listFollowUpsForLead(leadId: string, businessId: string): Promise<FollowUp[]> {
  const rows = await sql`
    select * from follow_ups where lead_id = ${leadId} and business_id = ${businessId} order by date asc
  `;
  return (rows as unknown as FollowUpRow[]).map(mapFollowUp);
}

export interface HotFollowUp extends FollowUp {
  ownerName: string;
  ownerKind: "client" | "lead";
  isOverdue: boolean;
}

/**
 * Upcoming/overdue follow-ups (not completed) across all clients and leads,
 * for the dashboard. `accessibleClientIds` (team-member scoping) restricts
 * client-owned follow-ups to that list — lead-owned ones are always included,
 * since leads aren't access-scoped.
 */
export async function listHotFollowUps(
  businessId: string,
  today: string,
  accessibleClientIds?: string[] | null
): Promise<HotFollowUp[]> {
  const rows = await sql`
    select
      f.id, f.client_id, f.lead_id, f.label, f.date, f.status, f.created_at, f.updated_at,
      f.assigned_to_team_member_id,
      coalesce(c.company_name, l.company_name) as owner_name,
      case when f.client_id is not null then 'client' else 'lead' end as owner_kind,
      f.date < ${today}::date as is_overdue
    from follow_ups f
    left join clients c on c.id = f.client_id
    left join leads l on l.id = f.lead_id
    where f.business_id = ${businessId}
      and f.status = 'UPCOMING' and f.date <= ${today}::date
      and (
        ${accessibleClientIds ?? null}::uuid[] is null
        or f.client_id is null
        or f.client_id = any(${accessibleClientIds ?? null}::uuid[])
      )
    order by f.date asc
  `;
  return (
    rows as unknown as (FollowUpRow & {
      owner_name: string;
      owner_kind: "client" | "lead";
      is_overdue: boolean;
    })[]
  ).map((row) => ({
    ...mapFollowUp(row),
    ownerName: row.owner_name,
    ownerKind: row.owner_kind,
    isOverdue: row.is_overdue,
  }));
}

/**
 * Every follow-up across all clients and leads, upcoming or completed — the
 * dedicated /follow-ups page (unlike listHotFollowUps, not capped to
 * due-today-or-earlier). `accessibleClientIds` scoping matches listHotFollowUps.
 */
export async function listAllFollowUps(
  businessId: string,
  today: string,
  accessibleClientIds?: string[] | null
): Promise<HotFollowUp[]> {
  const rows = await sql`
    select
      f.id, f.client_id, f.lead_id, f.label, f.date, f.status, f.created_at, f.updated_at,
      f.assigned_to_team_member_id,
      coalesce(c.company_name, l.company_name) as owner_name,
      case when f.client_id is not null then 'client' else 'lead' end as owner_kind,
      f.status = 'UPCOMING' and f.date < ${today}::date as is_overdue
    from follow_ups f
    left join clients c on c.id = f.client_id
    left join leads l on l.id = f.lead_id
    where f.business_id = ${businessId}
      and (
        ${accessibleClientIds ?? null}::uuid[] is null
        or f.client_id is null
        or f.client_id = any(${accessibleClientIds ?? null}::uuid[])
      )
    order by f.date asc
  `;
  return (
    rows as unknown as (FollowUpRow & {
      owner_name: string;
      owner_kind: "client" | "lead";
      is_overdue: boolean;
    })[]
  ).map((row) => ({
    ...mapFollowUp(row),
    ownerName: row.owner_name,
    ownerKind: row.owner_kind,
    isOverdue: row.is_overdue,
  }));
}

export async function addFollowUp(
  owner: { clientId?: string; leadId?: string },
  businessId: string,
  input: { label: string; date: string; assignedToTeamMemberId?: string | null }
): Promise<void> {
  await sql`
    insert into follow_ups (client_id, lead_id, business_id, label, date, assigned_to_team_member_id)
    values (${owner.clientId ?? null}, ${owner.leadId ?? null}, ${businessId}, ${input.label}, ${input.date}, ${input.assignedToTeamMemberId ?? null})
  `;
}

export async function updateFollowUp(
  id: string,
  businessId: string,
  input: { label: string; date: string; status: FollowUpStatus; assignedToTeamMemberId?: string | null }
): Promise<void> {
  await sql`
    update follow_ups set
      label = ${input.label}, date = ${input.date}, status = ${input.status},
      assigned_to_team_member_id = ${input.assignedToTeamMemberId ?? null}, updated_at = now()
    where id = ${id} and business_id = ${businessId}
  `;
}

export async function setFollowUpStatus(id: string, businessId: string, status: FollowUpStatus): Promise<void> {
  await sql`update follow_ups set status = ${status}, updated_at = now() where id = ${id} and business_id = ${businessId}`;
}

/** Read-only lookup used by the action layer to diff "did the assignee actually change" (and build the notification message) before firing an assignment notification — not used by any UI. */
export async function getFollowUpForNotification(
  id: string,
  businessId: string
): Promise<{ label: string; assignedToTeamMemberId: string | null } | null> {
  const rows = await sql`select label, assigned_to_team_member_id from follow_ups where id = ${id} and business_id = ${businessId}`;
  const row = rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return { label: row.label as string, assignedToTeamMemberId: row.assigned_to_team_member_id as string | null };
}

export async function setFollowUpAssignee(id: string, businessId: string, assignedToTeamMemberId: string | null): Promise<void> {
  await sql`update follow_ups set assigned_to_team_member_id = ${assignedToTeamMemberId}, updated_at = now() where id = ${id} and business_id = ${businessId}`;
}

/** See reassignTasksFromTeamMemberToOwner in data/todos.ts — same repair, for follow-ups. */
export async function reassignFollowUpsFromTeamMemberToOwner(businessId: string, teamMemberId: string): Promise<void> {
  await sql`
    update follow_ups set assigned_to_team_member_id = null
    where business_id = ${businessId} and assigned_to_team_member_id = ${teamMemberId}
  `;
}

export async function deleteFollowUp(id: string, businessId: string): Promise<void> {
  await sql`delete from follow_ups where id = ${id} and business_id = ${businessId}`;
}
