import { sql } from "@/lib/db";
import type { Task, TaskStatus, TaskType } from "@/lib/types";

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: TaskStatus;
  type: TaskType;
  client_id: string | null;
  lead_id: string | null;
  created_at: string;
  updated_at: string;
  tags: string[] | null;
  client_name?: string | null;
  lead_name?: string | null;
}

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    status: row.status,
    type: row.type,
    clientId: row.client_id,
    leadId: row.lead_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: (row.tags ?? []).filter(Boolean).sort(),
    clientName: row.client_name ?? undefined,
    leadName: row.lead_name ?? undefined,
  };
}

export interface TaskFilters {
  tag?: string;
  status?: TaskStatus;
  type?: TaskType;
  clientId?: string;
  leadId?: string;
}

export async function listTasks(filters: TaskFilters = {}): Promise<Task[]> {
  const rows = (await sql`
    select
      t.id, t.title, t.description, t.due_date, t.status, t.type, t.client_id, t.lead_id,
      t.created_at, t.updated_at,
      coalesce(array_agg(tg.name) filter (where tg.name is not null), '{}') as tags,
      c.company_name as client_name,
      l.company_name as lead_name
    from todos t
    left join todo_tags tt on tt.todo_id = t.id
    left join tags tg on tg.id = tt.tag_id
    left join clients c on c.id = t.client_id
    left join leads l on l.id = t.lead_id
    where (${filters.status ?? null}::task_status is null or t.status = ${filters.status ?? null})
      and (${filters.type ?? null}::task_type is null or t.type = ${filters.type ?? null})
      and (${filters.clientId ?? null}::uuid is null or t.client_id = ${filters.clientId ?? null})
      and (${filters.leadId ?? null}::uuid is null or t.lead_id = ${filters.leadId ?? null})
      and (
        ${filters.tag ?? null}::text is null
        or exists (
          select 1 from todo_tags tt2
          join tags tg2 on tg2.id = tt2.tag_id
          where tt2.todo_id = t.id and tg2.name = ${filters.tag ?? null}
        )
      )
    group by t.id, c.company_name, l.company_name
    order by (t.status = 'COMPLETED'), (t.due_date is null), t.due_date asc, t.created_at desc
  `) as unknown as TaskRow[];
  return rows.map(mapTask);
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

async function setTaskTags(taskId: string, tags: string[]): Promise<void> {
  await sql`delete from todo_tags where todo_id = ${taskId}`;
  const tagIds = await upsertTags(normalizeTags(tags));
  for (const tagId of tagIds) {
    await sql`insert into todo_tags (todo_id, tag_id) values (${taskId}, ${tagId}) on conflict do nothing`;
  }
}

export interface TaskInput {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  tags: string[];
  type: TaskType;
  clientId?: string | null;
  leadId?: string | null;
  status?: TaskStatus;
}

export async function createTask(input: TaskInput): Promise<string> {
  const rows = await sql`
    insert into todos (title, description, due_date, type, client_id, lead_id, status)
    values (
      ${input.title}, ${input.description ?? null}, ${input.dueDate ?? null},
      ${input.type}, ${input.clientId ?? null}, ${input.leadId ?? null},
      ${input.status ?? "TO_BE_DONE"}
    )
    returning id
  `;
  const taskId = (rows[0] as Record<string, unknown>).id as string;
  await setTaskTags(taskId, input.tags);
  return taskId;
}

export async function updateTask(id: string, input: TaskInput): Promise<void> {
  await sql`
    update todos set
      title = ${input.title},
      description = ${input.description ?? null},
      due_date = ${input.dueDate ?? null},
      updated_at = now()
    where id = ${id}
  `;
  await setTaskTags(id, input.tags);
}

export async function setTaskStatus(id: string, status: TaskStatus): Promise<void> {
  await sql`update todos set status = ${status}, updated_at = now() where id = ${id}`;
}

export async function deleteTask(id: string): Promise<void> {
  await sql`delete from todos where id = ${id}`;
}
