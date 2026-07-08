import { sql } from "@/lib/db";
import type { LeadSource } from "@/lib/types";

function mapLeadSource(row: Record<string, unknown>): LeadSource {
  return {
    id: row.id as string,
    name: row.name as string,
    isFallback: row.is_fallback as boolean,
    active: row.active as boolean,
    createdAt: row.created_at as string,
  };
}

export async function listLeadSources(businessId: string, opts: { includeInactive?: boolean } = {}): Promise<LeadSource[]> {
  const rows = opts.includeInactive
    ? await sql`select * from lead_sources where business_id = ${businessId} order by active desc, name asc`
    : await sql`select * from lead_sources where business_id = ${businessId} and active order by name asc`;
  return rows.map((r) => mapLeadSource(r as Record<string, unknown>));
}

export async function createLeadSource(businessId: string, name: string): Promise<LeadSource> {
  const rows = await sql`insert into lead_sources (business_id, name) values (${businessId}, ${name}) returning *`;
  return mapLeadSource(rows[0] as Record<string, unknown>);
}

export async function updateLeadSource(id: string, businessId: string, name: string): Promise<void> {
  await sql`update lead_sources set name = ${name} where id = ${id} and business_id = ${businessId}`;
}

export async function setLeadSourceActive(id: string, businessId: string, active: boolean): Promise<void> {
  await sql`update lead_sources set active = ${active} where id = ${id} and business_id = ${businessId}`;
}
