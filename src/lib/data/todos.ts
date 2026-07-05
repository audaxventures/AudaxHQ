import { sql } from "@/lib/db";
import type { Task, TaskPriority, TaskStatus, TaskType } from "@/lib/types";

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  todo_type_id: string | null;
  todo_type_name: string | null;
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
    priority: row.priority,
    type: row.type,
    todoTypeId: row.todo_type_id,
    todoTypeName: row.todo_type_name,
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
  priority?: TaskPriority;
  /** CLIENT or LEAD — the two fixed system types. Use todoTypeId to filter by a specific custom category. */
  type?: TaskType;
  todoTypeId?: string;
  clientId?: string;
  leadId?: string;
  /** Case-insensitive substring match against title or description. */
  search?: string;
}

export async function listTasks(filters: TaskFilters = {}): Promise<Task[]> {
  const searchPattern = filters.search ? `%${filters.search}%` : null;
  const rows = (await sql`
    select
      t.id, t.title, t.description, t.due_date, t.status, t.priority, t.type, t.todo_type_id, t.client_id, t.lead_id,
      t.created_at, t.updated_at,
      tt_lookup.name as todo_type_name,
      coalesce(array_agg(tg.name) filter (where tg.name is not null), '{}') as tags,
      c.company_name as client_name,
      l.company_name as lead_name
    from todos t
    left join todo_types tt_lookup on tt_lookup.id = t.todo_type_id
    left join todo_tags tt on tt.todo_id = t.id
    left join tags tg on tg.id = tt.tag_id
    left join clients c on c.id = t.client_id
    left join leads l on l.id = t.lead_id
    where (${filters.status ?? null}::task_status is null or t.status = ${filters.status ?? null})
      and (${filters.priority ?? null}::task_priority is null or t.priority = ${filters.priority ?? null})
      and (${filters.type ?? null}::text is null or t.type = ${filters.type ?? null})
      and (${filters.todoTypeId ?? null}::uuid is null or t.todo_type_id = ${filters.todoTypeId ?? null})
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
      and (
        ${searchPattern}::text is null
        or t.title ilike ${searchPattern}
        or t.description ilike ${searchPattern}
      )
    group by t.id, tt_lookup.name, c.company_name, l.company_name
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
  /** Required when type === "CUSTOM"; must be null for CLIENT/LEAD (enforced by a DB check constraint). */
  todoTypeId?: string | null;
  clientId?: string | null;
  leadId?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export async function createTask(input: TaskInput): Promise<string> {
  const rows = await sql`
    insert into todos (title, description, due_date, type, todo_type_id, client_id, lead_id, status, priority)
    values (
      ${input.title}, ${input.description ?? null}, ${input.dueDate ?? null},
      ${input.type}, ${input.todoTypeId ?? null}, ${input.clientId ?? null}, ${input.leadId ?? null},
      ${input.status ?? "TO_BE_DONE"}, ${input.priority ?? "MEDIUM"}
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
      priority = ${input.priority ?? "MEDIUM"},
      status = ${input.status ?? "TO_BE_DONE"},
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
