import { sql } from "@/lib/db";
import type { WorkCategory } from "@/lib/types";

function mapWorkCategory(row: Record<string, unknown>): WorkCategory {
  return {
    id: row.id as string,
    name: row.name as string,
    defaultHourlyRate: row.default_hourly_rate as string,
    active: row.active as boolean,
    createdAt: row.created_at as string,
  };
}

export async function listWorkCategories(opts: { includeInactive?: boolean } = {}): Promise<WorkCategory[]> {
  const rows = opts.includeInactive
    ? await sql`select * from work_categories order by active desc, name asc`
    : await sql`select * from work_categories where active order by name asc`;
  return rows.map((r) => mapWorkCategory(r as Record<string, unknown>));
}

export interface WorkCategoryInput {
  name: string;
  defaultHourlyRate: number;
}

export async function createWorkCategory(input: WorkCategoryInput): Promise<WorkCategory> {
  const rows = await sql`
    insert into work_categories (name, default_hourly_rate)
    values (${input.name}, ${input.defaultHourlyRate})
    returning *
  `;
  return mapWorkCategory(rows[0] as Record<string, unknown>);
}

export async function updateWorkCategory(id: string, input: WorkCategoryInput): Promise<void> {
  await sql`
    update work_categories set name = ${input.name}, default_hourly_rate = ${input.defaultHourlyRate}
    where id = ${id}
  `;
}

export async function setWorkCategoryActive(id: string, active: boolean): Promise<void> {
  await sql`update work_categories set active = ${active} where id = ${id}`;
}
