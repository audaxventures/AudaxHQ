import { sql } from "@/lib/db";
import type { TodoType } from "@/lib/types";

function mapTodoType(row: Record<string, unknown>): TodoType {
  return {
    id: row.id as string,
    name: row.name as string,
    active: row.active as boolean,
    createdAt: row.created_at as string,
  };
}

export async function listTodoTypes(businessId: string, opts: { includeInactive?: boolean } = {}): Promise<TodoType[]> {
  const rows = opts.includeInactive
    ? await sql`select * from todo_types where business_id = ${businessId} order by active desc, name asc`
    : await sql`select * from todo_types where business_id = ${businessId} and active order by name asc`;
  return rows.map((r) => mapTodoType(r as Record<string, unknown>));
}

export async function createTodoType(businessId: string, name: string): Promise<TodoType> {
  const rows = await sql`insert into todo_types (business_id, name) values (${businessId}, ${name}) returning *`;
  return mapTodoType(rows[0] as Record<string, unknown>);
}

export async function updateTodoType(id: string, businessId: string, name: string): Promise<void> {
  await sql`update todo_types set name = ${name} where id = ${id} and business_id = ${businessId}`;
}

export async function setTodoTypeActive(id: string, businessId: string, active: boolean): Promise<void> {
  await sql`update todo_types set active = ${active} where id = ${id} and business_id = ${businessId}`;
}
