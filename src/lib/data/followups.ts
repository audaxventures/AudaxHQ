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
  };
}

export async function listFollowUpsForClient(clientId: string): Promise<FollowUp[]> {
  const rows = await sql`
    select * from follow_ups where client_id = ${clientId} order by date asc
  `;
  return (rows as unknown as FollowUpRow[]).map(mapFollowUp);
}

export async function listFollowUpsForLead(leadId: string): Promise<FollowUp[]> {
  const rows = await sql`
    select * from follow_ups where lead_id = ${leadId} order by date asc
  `;
  return (rows as unknown as FollowUpRow[]).map(mapFollowUp);
}

export interface HotFollowUp extends FollowUp {
  ownerName: string;
  ownerKind: "client" | "lead";
  isOverdue: boolean;
}

/** Upcoming/overdue follow-ups (not completed) across all clients and leads, for the dashboard. */
export async function listHotFollowUps(): Promise<HotFollowUp[]> {
  const rows = await sql`
    select
      f.id, f.client_id, f.lead_id, f.label, f.date, f.status, f.created_at, f.updated_at,
      coalesce(c.company_name, l.company_name) as owner_name,
      case when f.client_id is not null then 'client' else 'lead' end as owner_kind,
      f.date < current_date as is_overdue
    from follow_ups f
    left join clients c on c.id = f.client_id
    left join leads l on l.id = f.lead_id
    where f.status = 'UPCOMING' and f.date <= current_date
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
  input: { label: string; date: string }
): Promise<void> {
  await sql`
    insert into follow_ups (client_id, lead_id, label, date)
    values (${owner.clientId ?? null}, ${owner.leadId ?? null}, ${input.label}, ${input.date})
  `;
}

export async function updateFollowUp(
  id: string,
  input: { label: string; date: string; status: FollowUpStatus }
): Promise<void> {
  await sql`
    update follow_ups set label = ${input.label}, date = ${input.date}, status = ${input.status}, updated_at = now()
    where id = ${id}
  `;
}

export async function setFollowUpStatus(id: string, status: FollowUpStatus): Promise<void> {
  await sql`update follow_ups set status = ${status}, updated_at = now() where id = ${id}`;
}

export async function deleteFollowUp(id: string): Promise<void> {
  await sql`delete from follow_ups where id = ${id}`;
}
