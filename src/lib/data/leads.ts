import { sql } from "@/lib/db";
import type { Lead, LeadNote, LeadStatus, LeadWithNotes } from "@/lib/types";

function mapLead(row: Record<string, unknown>): Lead {
  return {
    id: row.id as string,
    name: row.name as string,
    company: row.company as string | null,
    contactEmail: row.contact_email as string | null,
    contactPhone: row.contact_phone as string | null,
    status: row.status as LeadStatus,
    estimatedValue: row.estimated_value as string | null,
    nextFollowUpDate: row.next_follow_up_date as string | null,
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
}

export async function listLeads(filters: LeadFilters = {}): Promise<Lead[]> {
  const rows = await sql`
    select * from leads
    where (${filters.status ?? null}::lead_status is null or status = ${filters.status ?? null})
    order by
      case when next_follow_up_date is null then 1 else 0 end asc,
      next_follow_up_date asc,
      created_at desc
  `;
  return rows.map((r) => mapLead(r as Record<string, unknown>));
}

export async function getLead(id: string): Promise<LeadWithNotes | null> {
  const [leadRows, noteRows] = await Promise.all([
    sql`select * from leads where id = ${id}`,
    sql`select * from lead_notes where lead_id = ${id} order by created_at desc`,
  ]);
  if (leadRows.length === 0) return null;
  return {
    ...mapLead(leadRows[0] as Record<string, unknown>),
    notes: noteRows.map((r) => mapNote(r as Record<string, unknown>)),
  };
}

export interface CreateLeadInput {
  name: string;
  company?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  status: LeadStatus;
  estimatedValue?: number | null;
  nextFollowUpDate?: string | null;
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const rows = await sql`
    insert into leads (name, company, contact_email, contact_phone, status, estimated_value, next_follow_up_date)
    values (${input.name}, ${input.company ?? null}, ${input.contactEmail ?? null}, ${input.contactPhone ?? null}, ${input.status}, ${input.estimatedValue ?? null}, ${input.nextFollowUpDate ?? null})
    returning *
  `;
  return mapLead(rows[0] as Record<string, unknown>);
}

export async function updateLead(id: string, input: CreateLeadInput): Promise<void> {
  await sql`
    update leads set
      name = ${input.name},
      company = ${input.company ?? null},
      contact_email = ${input.contactEmail ?? null},
      contact_phone = ${input.contactPhone ?? null},
      status = ${input.status},
      estimated_value = ${input.estimatedValue ?? null},
      next_follow_up_date = ${input.nextFollowUpDate ?? null},
      updated_at = now()
    where id = ${id}
  `;
}

export async function deleteLead(id: string): Promise<void> {
  await sql`delete from leads where id = ${id}`;
}

export async function addLeadNote(leadId: string, body: string): Promise<void> {
  await sql`insert into lead_notes (lead_id, body) values (${leadId}, ${body})`;
}

export async function markLeadConverted(leadId: string, clientId: string): Promise<void> {
  await sql`update leads set converted_client_id = ${clientId}, updated_at = now() where id = ${leadId}`;
}
