import { sql } from "@/lib/db";
import type { Todo, TodoStatus } from "@/lib/types";

interface TodoRow {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: TodoStatus;
  created_at: string;
  updated_at: string;
  tags: string[] | null;
}

function mapTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: (row.tags ?? []).filter(Boolean).sort(),
  };
}

export interface TodoFilters {
  tag?: string;
  status?: TodoStatus;
}

export async function listTodos(filters: TodoFilters = {}): Promise<Todo[]> {
  const rows = (await sql`
    select
      t.id, t.title, t.description, t.due_date, t.status, t.created_at, t.updated_at,
      coalesce(array_agg(tg.name) filter (where tg.name is not null), '{}') as tags
    from todos t
    left join todo_tags tt on tt.todo_id = t.id
    left join tags tg on tg.id = tt.tag_id
    where (${filters.status ?? null}::todo_status is null or t.status = ${filters.status ?? null})
      and (
        ${filters.tag ?? null}::text is null
        or exists (
          select 1 from todo_tags tt2
          join tags tg2 on tg2.id = tt2.tag_id
          where tt2.todo_id = t.id and tg2.name = ${filters.tag ?? null}
        )
      )
    group by t.id
    order by t.status asc, (t.due_date is null), t.due_date asc, t.created_at desc
  `) as unknown as TodoRow[];
  return rows.map(mapTodo);
}

export async function listAllTags(): Promise<string[]> {
  const rows = await sql`select name from tags order by name asc`;
  return rows.map((r) => (r as Record<string, unknown>).name as string);
}

async function upsertTags(tagNames: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const name of tagNames) {
    const rows = await sql`
      insert into tags (name) values (${name})
      on conflict (name) do update set name = excluded.name
      returning id
    `;
    ids.push((rows[0] as Record<string, unknown>).id as string);
  }
  return ids;
}

function normalizeTags(tags: string[]): string[] {
  const set = new Set(
    tags
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => t.toLowerCase())
  );
  return Array.from(set);
}

export interface TodoInput {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  tags: string[];
}

export async function createTodo(input: TodoInput): Promise<string> {
  const rows = await sql`
    insert into todos (title, description, due_date)
    values (${input.title}, ${input.description ?? null}, ${input.dueDate ?? null})
    returning id
  `;
  const todoId = (rows[0] as Record<string, unknown>).id as string;
  const tagIds = await upsertTags(normalizeTags(input.tags));
  for (const tagId of tagIds) {
    await sql`insert into todo_tags (todo_id, tag_id) values (${todoId}, ${tagId}) on conflict do nothing`;
  }
  return todoId;
}

export async function updateTodo(id: string, input: TodoInput): Promise<void> {
  await sql`
    update todos set
      title = ${input.title},
      description = ${input.description ?? null},
      due_date = ${input.dueDate ?? null},
      updated_at = now()
    where id = ${id}
  `;
  await sql`delete from todo_tags where todo_id = ${id}`;
  const tagIds = await upsertTags(normalizeTags(input.tags));
  for (const tagId of tagIds) {
    await sql`insert into todo_tags (todo_id, tag_id) values (${id}, ${tagId}) on conflict do nothing`;
  }
}

export async function setTodoStatus(id: string, status: TodoStatus): Promise<void> {
  await sql`update todos set status = ${status}, updated_at = now() where id = ${id}`;
}

export async function deleteTodo(id: string): Promise<void> {
  await sql`delete from todos where id = ${id}`;
}
