import { sql } from "@/lib/db";
import type { WorkType } from "@/lib/types";

function mapWorkType(row: Record<string, unknown>): WorkType {
  return {
    id: row.id as string,
    name: row.name as string,
    isFallback: row.is_fallback as boolean,
    active: row.active as boolean,
    createdAt: row.created_at as string,
  };
}

export async function listWorkTypes(businessId: string, opts: { includeInactive?: boolean } = {}): Promise<WorkType[]> {
  const rows = opts.includeInactive
    ? await sql`select * from work_types where business_id = ${businessId} order by active desc, name asc`
    : await sql`select * from work_types where business_id = ${businessId} and active order by name asc`;
  return rows.map((r) => mapWorkType(r as Record<string, unknown>));
}

export async function createWorkType(businessId: string, name: string): Promise<WorkType> {
  const rows = await sql`insert into work_types (business_id, name) values (${businessId}, ${name}) returning *`;
  return mapWorkType(rows[0] as Record<string, unknown>);
}

export async function updateWorkType(id: string, businessId: string, name: string): Promise<void> {
  await sql`update work_types set name = ${name} where id = ${id} and business_id = ${businessId}`;
}

export async function setWorkTypeActive(id: string, businessId: string, active: boolean): Promise<void> {
  await sql`update work_types set active = ${active} where id = ${id} and business_id = ${businessId}`;
}
