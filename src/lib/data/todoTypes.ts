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

export async function listTodoTypes(opts: { includeInactive?: boolean } = {}): Promise<TodoType[]> {
  const rows = opts.includeInactive
    ? await sql`select * from todo_types order by active desc, name asc`
    : await sql`select * from todo_types where active order by name asc`;
  return rows.map((r) => mapTodoType(r as Record<string, unknown>));
}

export async function createTodoType(name: string): Promise<TodoType> {
  const rows = await sql`insert into todo_types (name) values (${name}) returning *`;
  return mapTodoType(rows[0] as Record<string, unknown>);
}

export async function updateTodoType(id: string, name: string): Promise<void> {
  await sql`update todo_types set name = ${name} where id = ${id}`;
}

export async function setTodoTypeActive(id: string, active: boolean): Promise<void> {
  await sql`update todo_types set active = ${active} where id = ${id}`;
}
