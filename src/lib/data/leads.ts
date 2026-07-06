import { sql } from "@/lib/db";
import { listTasks } from "@/lib/data/todos";
import { listFollowUpsForLead } from "@/lib/data/followups";
import { listMeetingNotes } from "@/lib/data/meetingnotes";
import { createClient } from "@/lib/data/clients";
import type { Lead, LeadNote, LeadStatus, LeadWithRelations } from "@/lib/types";

function mapLead(row: Record<string, unknown>): Lead {
  return {
    id: row.id as string,
    companyName: row.company_name as string,
    contactName: row.contact_name as string | null,
    contactEmail: row.contact_email as string | null,
    contactPhone: row.contact_phone as string | null,
    status: row.status as LeadStatus,
    estimatedValue: row.estimated_value as string | null,
    workTypeId: row.work_type_id as string | null,
    workTypeName: (row.work_type_name as string | null) ?? null,
    workTypeOther: row.work_type_other as string | null,
    sourceId: row.source_id as string | null,
    sourceName: (row.source_name as string | null) ?? null,
    sourceOther: row.source_other as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    convertedClientId: row.converted_client_id as string | null,
  };
}

function mapNote(row: Record<string, unknown>): LeadNote {
  return {
    id: row.id as string,
    leadId: row.lead_id as string,
    body: row.body as string,
    createdAt: row.created_at as string,
  };
}

export interface LeadFilters {
  status?: LeadStatus;
  limit?: number;
  offset?: number;
}

export async function listLeads(
  filters: LeadFilters = {}
): Promise<(Lead & { nextFollowUpDate: string | null })[]> {
  const rows = await sql`
    select l.*, wt.name as work_type_name, ls.name as source_name, f.next_date as next_follow_up_date
    from leads l
    left join work_types wt on wt.id = l.work_type_id
    left join lead_sources ls on ls.id = l.source_id
    left join (
      select lead_id, min(date) as next_date
      from follow_ups
      where status = 'UPCOMING'
      group by lead_id
    ) f on f.lead_id = l.id
    where (${filters.status ?? null}::lead_status is null or l.status = ${filters.status ?? null})
    order by
      case when f.next_date is null then 1 else 0 end asc,
      f.next_date asc,
      l.created_at desc
    limit ${filters.limit ?? null}
    offset ${filters.offset ?? 0}
  `;
  return rows.map((row) => ({
    ...mapLead(row as Record<string, unknown>),
    nextFollowUpDate: (row as Record<string, unknown>).next_follow_up_date as string | null,
  }));
}

export async function countLeads(filters: Pick<LeadFilters, "status"> = {}): Promise<number> {
  const rows = await sql`
    select count(*) as count
    from leads l
    where (${filters.status ?? null}::lead_status is null or l.status = ${filters.status ?? null})
  `;
  return Number((rows[0] as Record<string, unknown>).count);
}

export async function getLead(id: string): Promise<LeadWithRelations | null> {
  const [leadRows, noteRows, tasks, followUps, meetingNotes] = await Promise.all([
    sql`
      select l.*, wt.name as work_type_name, ls.name as source_name
      from leads l
      left join work_types wt on wt.id = l.work_type_id
      left join lead_sources ls on ls.id = l.source_id
      where l.id = ${id}
    `,
    sql`select * from lead_notes where lead_id = ${id} order by created_at desc`,
    listTasks({ leadId: id }),
    listFollowUpsForLead(id),
    listMeetingNotes({ leadId: id }),
  ]);
  if (leadRows.length === 0) return null;
  return {
    ...mapLead(leadRows[0] as Record<string, unknown>),
    notes: noteRows.map((r) => mapNote(r as Record<string, unknown>)),
    tasks,
    followUps,
    meetingNotes,
  };
}

export interface LeadInput {
  companyName: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  status: LeadStatus;
  estimatedValue?: number | null;
  workTypeId?: string | null;
  workTypeOther?: string | null;
  sourceId?: string | null;
  sourceOther?: string | null;
}

export async function createLead(input: LeadInput): Promise<Lead> {
  const rows = await sql`
    insert into leads (company_name, contact_name, contact_email, contact_phone, status, estimated_value, work_type_id, work_type_other, source_id, source_other)
    values (
      ${input.companyName}, ${input.contactName ?? null}, ${input.contactEmail ?? null}, ${input.contactPhone ?? null},
      ${input.status}, ${input.estimatedValue ?? null}, ${input.workTypeId ?? null}, ${input.workTypeOther ?? null},
      ${input.sourceId ?? null}, ${input.sourceOther ?? null}
    )
    returning *
  `;
  return mapLead(rows[0] as Record<string, unknown>);
}

/**
 * Updates a lead. If the status is being changed to WON and the lead
 * hasn't already been converted, automatically creates a Client record
 * pre-filled from the lead (company/contact info, work type, notes) and
 * links it back to the lead. Returns the new client's id when a
 * conversion happened, so the caller can surface a confirmation.
 */
export async function updateLead(
  id: string,
  input: LeadInput,
  today: string
): Promise<{ convertedClientId: string | null }> {
  const existingRows = await sql`select status, converted_client_id from leads where id = ${id}`;
  const existing = existingRows[0] as Record<string, unknown> | undefined;
  const wasAlreadyConverted = Boolean(existing?.converted_client_id);

  await sql`
    update leads set
      company_name = ${input.companyName},
      contact_name = ${input.contactName ?? null},
      contact_email = ${input.contactEmail ?? null},
      contact_phone = ${input.contactPhone ?? null},
      status = ${input.status},
      estimated_value = ${input.estimatedValue ?? null},
      work_type_id = ${input.workTypeId ?? null},
      work_type_other = ${input.workTypeOther ?? null},
      source_id = ${input.sourceId ?? null},
      source_other = ${input.sourceOther ?? null},
      updated_at = now()
    where id = ${id}
  `;

  if (input.status === "WON" && !wasAlreadyConverted) {
    const clientId = await convertLeadToClient(id, today);
    return { convertedClientId: clientId };
  }

  return { convertedClientId: null };
}

/** Creates a Client from a lead's current data, copies its notes, and links the two. */
export async function convertLeadToClient(leadId: string, today: string): Promise<string> {
  const leadRows = await sql`select * from leads where id = ${leadId}`;
  if (leadRows.length === 0) throw new Error("Lead not found");
  const lead = mapLead(leadRows[0] as Record<string, unknown>);

  const client = await createClient(
    {
      companyName: lead.companyName,
      contactName: lead.contactName,
      contactEmail: lead.contactEmail,
      contactPhone: lead.contactPhone,
      type: "PROJECT",
      status: "ACTIVE",
      rate: lead.estimatedValue ? Number(lead.estimatedValue) : 0,
      workTypeId: lead.workTypeId,
      workTypeOther: lead.workTypeOther,
    },
    today
  );

  await sql`update leads set converted_client_id = ${client.id}, updated_at = now() where id = ${leadId}`;

  await sql`insert into client_notes (client_id, body) values (${client.id}, ${"Converted from lead — activity history below carried over."})`;

  const leadNotes = await sql`select body, created_at from lead_notes where lead_id = ${leadId} order by created_at asc`;
  for (const note of leadNotes) {
    const n = note as Record<string, unknown>;
    await sql`insert into client_notes (client_id, body, created_at) values (${client.id}, ${n.body as string}, ${n.created_at as string})`;
  }

  return client.id;
}

export async function deleteLead(id: string): Promise<void> {
  await sql`delete from leads where id = ${id}`;
}

export async function addLeadNote(leadId: string, body: string): Promise<void> {
  await sql`insert into lead_notes (lead_id, body) values (${leadId}, ${body})`;
}
