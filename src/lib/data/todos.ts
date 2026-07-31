import { sql } from "@/lib/db";
import type { EntityColor, Task, TaskOwner, TaskPriority, TaskStatus, TaskType } from "@/lib/types";

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
  partner_id: string | null;
  created_at: string;
  updated_at: string;
  tags: string[] | null;
  client_name?: string | null;
  lead_name?: string | null;
  partner_name?: string | null;
  client_color?: EntityColor | null;
  lead_color?: EntityColor | null;
  partner_color?: EntityColor | null;
  assigned_to_team_member_id: string | null;
  created_by_team_member_id: string | null;
  created_by_name: string | null;
  meeting_note_id: string | null;
  owned_by: TaskOwner;
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
    partnerId: row.partner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: (row.tags ?? []).filter(Boolean).sort(),
    clientName: row.client_name ?? undefined,
    leadName: row.lead_name ?? undefined,
    partnerName: row.partner_name ?? undefined,
    clientColor: row.client_color ?? null,
    leadColor: row.lead_color ?? null,
    partnerColor: row.partner_color ?? null,
    assignedToTeamMemberId: row.assigned_to_team_member_id,
    createdByTeamMemberId: row.created_by_team_member_id,
    createdByName: row.created_by_name ?? "Owner",
    meetingNoteId: row.meeting_note_id,
    ownedBy: row.owned_by,
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
  partnerId?: string;
  /**
   * Partner-owned to-dos are excluded by default (they'd otherwise leak onto
   * the general team-visible /todos board and dashboard, defeating the
   * owner-only gating on Partners) — pass true to include them anyway, which
   * only the owner-only full data export should ever do.
   */
  includePartnerOwned?: boolean;
  /**
   * 'EXTERNAL' to-dos (the client/lead/partner's own commitment, not the
   * team's) are excluded by default — pass true to include them alongside
   * the normal 'TEAM' rows, e.g. for the owner-scoped views that show
   * what's still outstanding from the other side.
   */
  includeExternal?: boolean;
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
  /**
   * Broadens visibleTo for 'EXTERNAL' to-dos only: a client/lead's own
   * commitment is relevant to anyone who works that account, not just
   * whoever happened to log the meeting note it came from. Lead-tied ones
   * are always included (leads aren't access-scoped at all — see
   * requireLeadAccess); client-tied ones are included when the client is in
   * this list. Pass null for the owner (unrestricted); omit entirely (or
   * pass undefined) to grant no extra client-based visibility, which is the
   * safe default for any caller that doesn't know the viewer's access list.
   */
  accessibleClientIds?: string[] | null;
}

export async function listTasks(businessId: string, filters: TaskFilters = {}): Promise<Task[]> {
  const searchPattern = filters.search ? `%${filters.search}%` : null;
  const hasVisibleToFilter = "visibleTo" in filters;
  const visibleToValue = filters.visibleTo ?? null;
  const accessibleClientIdsValue = filters.accessibleClientIds === undefined ? [] : filters.accessibleClientIds;
  const rows = (await sql`
    select
      t.id, t.title, t.description, t.due_date, t.status, t.priority, t.type, t.todo_type_id, t.client_id, t.lead_id, t.partner_id,
      t.created_at, t.updated_at, t.assigned_to_team_member_id, t.created_by_team_member_id, t.meeting_note_id, t.owned_by,
      tt_lookup.name as todo_type_name,
      coalesce(array_agg(tg.name) filter (where tg.name is not null), '{}') as tags,
      c.company_name as client_name,
      l.company_name as lead_name,
      p.company_name as partner_name,
      c.color as client_color,
      l.color as lead_color,
      p.color as partner_color,
      creator_tm.name as created_by_name
    from todos t
    left join todo_types tt_lookup on tt_lookup.id = t.todo_type_id
    left join todo_tags tt on tt.todo_id = t.id
    left join tags tg on tg.id = tt.tag_id
    left join clients c on c.id = t.client_id
    left join leads l on l.id = t.lead_id
    left join partners p on p.id = t.partner_id
    left join team_members creator_tm on creator_tm.id = t.created_by_team_member_id
    where t.business_id = ${businessId}
      and (t.owned_by = 'TEAM' or (t.owned_by = 'EXTERNAL' and ${filters.includeExternal ?? false}))
      and (${filters.status ?? null}::task_status is null or t.status = ${filters.status ?? null})
      and (${filters.priority ?? null}::task_priority is null or t.priority = ${filters.priority ?? null})
      and (${filters.type ?? null}::text is null or t.type = ${filters.type ?? null})
      and (${filters.todoTypeId ?? null}::uuid is null or t.todo_type_id = ${filters.todoTypeId ?? null})
      and (${filters.clientId ?? null}::uuid is null or t.client_id = ${filters.clientId ?? null})
      and (${filters.leadId ?? null}::uuid is null or t.lead_id = ${filters.leadId ?? null})
      and (
        ${filters.includePartnerOwned ?? false}
        or (${filters.partnerId ?? null}::uuid is not null and t.partner_id = ${filters.partnerId ?? null})
        or (${filters.partnerId ?? null}::uuid is null and t.partner_id is null)
      )
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
        or (
          t.owned_by = 'EXTERNAL'
          and (
            t.lead_id is not null
            or (
              t.client_id is not null
              and (
                ${accessibleClientIdsValue}::uuid[] is null
                or t.client_id = any(${accessibleClientIdsValue}::uuid[])
              )
            )
          )
        )
      )
    group by t.id, tt_lookup.name, c.company_name, l.company_name, p.company_name, c.color, l.color, p.color, creator_tm.name
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
  partnerId?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  /** Whose board this lands on — null means the workspace owner. */
  assignedToTeamMemberId?: string | null;
}

/** Read-only lookup used by the action layer to diff "did the assignee actually change" before firing an assignment notification — not used by any UI. */
export async function getTaskAssignee(id: string, businessId: string): Promise<string | null> {
  const rows = await sql`select assigned_to_team_member_id from todos where id = ${id} and business_id = ${businessId}`;
  return ((rows[0] as Record<string, unknown>)?.assigned_to_team_member_id as string | null) ?? null;
}

export async function createTask(businessId: string, input: TaskInput, createdByTeamMemberId: string | null): Promise<string> {
  const rows = await sql`
    insert into todos (business_id, title, description, due_date, type, todo_type_id, client_id, lead_id, partner_id, status, priority, assigned_to_team_member_id, created_by_team_member_id)
    values (
      ${businessId}, ${input.title}, ${input.description ?? null}, ${input.dueDate ?? null},
      ${input.type}, ${input.todoTypeId ?? null}, ${input.clientId ?? null}, ${input.leadId ?? null}, ${input.partnerId ?? null},
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
      type = ${input.type},
      todo_type_id = ${input.todoTypeId ?? null},
      client_id = ${input.clientId ?? null},
      lead_id = ${input.leadId ?? null},
      partner_id = ${input.partnerId ?? null},
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

export interface ActionItemTaskInput {
  title: string;
  dueDate: string | null;
  type: "CLIENT" | "LEAD" | "PARTNER";
  clientId?: string | null;
  leadId?: string | null;
  partnerId?: string | null;
  meetingNoteId: string;
  ownedBy: TaskOwner;
}

/**
 * Quick-added from a meeting note's action items — a lighter path than
 * createTask (no tags/description/custom type), always linked back to the
 * meeting via meeting_note_id so the note can show these as a live checklist.
 * An 'EXTERNAL' item (the client/lead's own commitment, not the team's) is
 * never assigned to anyone on the team — assignment doesn't apply to it.
 */
export async function createActionItemTask(
  businessId: string,
  input: ActionItemTaskInput,
  createdByTeamMemberId: string | null
): Promise<string> {
  const assignedTo = input.ownedBy === "EXTERNAL" ? null : createdByTeamMemberId;
  const rows = await sql`
    insert into todos (business_id, title, due_date, type, client_id, lead_id, partner_id, meeting_note_id, assigned_to_team_member_id, created_by_team_member_id, owned_by)
    values (
      ${businessId}, ${input.title}, ${input.dueDate}, ${input.type}, ${input.clientId ?? null}, ${input.leadId ?? null}, ${input.partnerId ?? null},
      ${input.meetingNoteId}, ${assignedTo}, ${createdByTeamMemberId}, ${input.ownedBy}
    )
    returning id
  `;
  return (rows[0] as Record<string, unknown>).id as string;
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
