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
  assigned_to_team_member_id: string | null;
  created_by_team_member_id: string | null;
  created_by_name: string | null;
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
    assignedToTeamMemberId: row.assigned_to_team_member_id,
    createdByTeamMemberId: row.created_by_team_member_id,
    createdByName: row.created_by_name ?? "Owner",
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
  /**
   * Restrict to to-dos visible to this person: assigned to them, or created
   * by them (so handing a to-do off to someone else doesn't make it vanish
   * for whoever assigned it — they keep visibility and edit rights, just not
   * drag-and-drop board ownership). Omit the key entirely for an unfiltered
   * (all to-dos) view, which only the owner-only full data export should
   * ever do. Pass null for the owner's own board/creations, or a team
   * member's id for theirs.
   */
  visibleTo?: string | null;
}

export async function listTasks(businessId: string, filters: TaskFilters = {}): Promise<Task[]> {
  const searchPattern = filters.search ? `%${filters.search}%` : null;
  const hasVisibleToFilter = "visibleTo" in filters;
  const visibleToValue = filters.visibleTo ?? null;
  const rows = (await sql`
    select
      t.id, t.title, t.description, t.due_date, t.status, t.priority, t.type, t.todo_type_id, t.client_id, t.lead_id,
      t.created_at, t.updated_at, t.assigned_to_team_member_id, t.created_by_team_member_id,
      tt_lookup.name as todo_type_name,
      coalesce(array_agg(tg.name) filter (where tg.name is not null), '{}') as tags,
      c.company_name as client_name,
      l.company_name as lead_name,
      creator_tm.name as created_by_name
    from todos t
    left join todo_types tt_lookup on tt_lookup.id = t.todo_type_id
    left join todo_tags tt on tt.todo_id = t.id
    left join tags tg on tg.id = tt.tag_id
    left join clients c on c.id = t.client_id
    left join leads l on l.id = t.lead_id
    left join team_members creator_tm on creator_tm.id = t.created_by_team_member_id
    where t.business_id = ${businessId}
      and (${filters.status ?? null}::task_status is null or t.status = ${filters.status ?? null})
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
      and (
        ${hasVisibleToFilter} is false
        or t.assigned_to_team_member_id is not distinct from ${visibleToValue}::uuid
        or t.created_by_team_member_id is not distinct from ${visibleToValue}::uuid
      )
    group by t.id, tt_lookup.name, c.company_name, l.company_name, creator_tm.name
    order by (t.status = 'COMPLETED'), (t.due_date is null), t.due_date asc, t.created_at desc
  `) as unknown as TaskRow[];
  return rows.map(mapTask);
}

export async function listAllTags(businessId: string): Promise<string[]> {
  const rows = await sql`select name from tags where business_id = ${businessId} order by name asc`;
  return rows.map((r) => (r as Record<string, unknown>).name as string);
}

async function upsertTags(businessId: string, tagNames: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const name of tagNames) {
    const rows = await sql`
      insert into tags (business_id, name) values (${businessId}, ${name})
      on conflict (business_id, name) do update set name = excluded.name
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

async function setTaskTags(taskId: string, businessId: string, tags: string[]): Promise<void> {
  await sql`delete from todo_tags where todo_id = ${taskId} and business_id = ${businessId}`;
  const tagIds = await upsertTags(businessId, normalizeTags(tags));
  for (const tagId of tagIds) {
    await sql`insert into todo_tags (todo_id, tag_id, business_id) values (${taskId}, ${tagId}, ${businessId}) on conflict do nothing`;
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
  /** Whose board this lands on — null means the workspace owner. */
  assignedToTeamMemberId?: string | null;
}

export async function createTask(businessId: string, input: TaskInput, createdByTeamMemberId: string | null): Promise<string> {
  const rows = await sql`
    insert into todos (business_id, title, description, due_date, type, todo_type_id, client_id, lead_id, status, priority, assigned_to_team_member_id, created_by_team_member_id)
    values (
      ${businessId}, ${input.title}, ${input.description ?? null}, ${input.dueDate ?? null},
      ${input.type}, ${input.todoTypeId ?? null}, ${input.clientId ?? null}, ${input.leadId ?? null},
      ${input.status ?? "TO_BE_DONE"}, ${input.priority ?? "MEDIUM"},
      ${input.assignedToTeamMemberId ?? null}, ${createdByTeamMemberId}
    )
    returning id
  `;
  const taskId = (rows[0] as Record<string, unknown>).id as string;
  await setTaskTags(taskId, businessId, input.tags);
  return taskId;
}

/**
 * `callerTeamMemberId` is always the caller's own identity (null for the
 * owner, a team member's id otherwise) — everyone, owner included, may only
 * touch to-dos they're currently assigned OR the ones they created (so
 * handing a to-do off doesn't strip the assigner's own edit rights over it).
 * A mismatch is a silent no-op rather than an error, since the row simply
 * isn't reachable to this caller.
 */
export async function updateTask(id: string, businessId: string, input: TaskInput, callerTeamMemberId: string | null): Promise<void> {
  await sql`
    update todos set
      title = ${input.title},
      description = ${input.description ?? null},
      due_date = ${input.dueDate ?? null},
      priority = ${input.priority ?? "MEDIUM"},
      status = ${input.status ?? "TO_BE_DONE"},
      assigned_to_team_member_id = ${input.assignedToTeamMemberId ?? null},
      updated_at = now()
    where id = ${id} and business_id = ${businessId}
      and (
        assigned_to_team_member_id is not distinct from ${callerTeamMemberId}::uuid
        or created_by_team_member_id is not distinct from ${callerTeamMemberId}::uuid
      )
  `;
  await setTaskTags(id, businessId, input.tags);
}

export async function setTaskStatus(id: string, businessId: string, status: TaskStatus, callerTeamMemberId: string | null): Promise<void> {
  await sql`
    update todos set status = ${status}, updated_at = now()
    where id = ${id} and business_id = ${businessId}
      and (
        assigned_to_team_member_id is not distinct from ${callerTeamMemberId}::uuid
        or created_by_team_member_id is not distinct from ${callerTeamMemberId}::uuid
      )
  `;
}

export async function deleteTask(id: string, businessId: string, callerTeamMemberId: string | null): Promise<void> {
  await sql`
    delete from todos
    where id = ${id} and business_id = ${businessId}
      and (
        assigned_to_team_member_id is not distinct from ${callerTeamMemberId}::uuid
        or created_by_team_member_id is not distinct from ${callerTeamMemberId}::uuid
      )
  `;
}
