import { sql } from "@/lib/db";
import { formatDateInput, formatTime } from "@/lib/format";

export type CalendarEventKind = "FOLLOW_UP" | "MEETING" | "TASK" | "EXTERNAL";

export const CALENDAR_EVENT_KIND_LABELS: Record<CalendarEventKind, string> = {
  FOLLOW_UP: "Follow-up",
  MEETING: "Meeting",
  TASK: "Task",
  EXTERNAL: "Connected calendar",
};

export const CALENDAR_EVENT_KIND_ORDER: CalendarEventKind[] = ["FOLLOW_UP", "MEETING", "TASK", "EXTERNAL"];

export interface CalendarEvent {
  id: string;
  kind: CalendarEventKind;
  date: string;
  title: string;
  /** Formatted start time (e.g. "2:30 PM") — meetings and connected-calendar events only, and only when one was set. */
  time: string | null;
  /** Client/lead name for internal events, the team member's name for an imported EXTERNAL event. */
  ownerName: string | null;
  /** Null for EXTERNAL events — an imported event has no in-app record to link to. */
  href: string | null;
  completed: boolean;
}

export interface CalendarEventFilters {
  /** Team-member scoping: only their own assigned tasks, and only their own connected calendar (never a teammate's). Undefined/null = no restriction (owner). */
  restrictToTeamMemberId?: string | null;
  /** Team-member scoping: client-owned follow-ups/meetings restricted to this list — lead-owned ones are always included, since leads aren't access-scoped. Undefined/null = no restriction (owner). */
  accessibleClientIds?: string[] | null;
}

export async function listCalendarEvents(
  businessId: string,
  from: string,
  to: string,
  timezone: string,
  filters: CalendarEventFilters = {}
): Promise<CalendarEvent[]> {
  const [followUpRows, meetingRows, taskRows, externalRows] = await Promise.all([
    sql`
      select f.id, f.date, f.label, f.client_id, f.lead_id,
        coalesce(c.company_name, l.company_name) as owner_name
      from follow_ups f
      left join clients c on c.id = f.client_id
      left join leads l on l.id = f.lead_id
      where f.business_id = ${businessId}
        and f.status = 'UPCOMING' and f.date between ${from} and ${to}
        and (
          ${filters.accessibleClientIds ?? null}::uuid[] is null
          or f.client_id is null
          or f.client_id = any(${filters.accessibleClientIds ?? null}::uuid[])
        )
    `,
    sql`
      select m.id, m.meeting_date as date, m.title, m.start_time, m.client_id, m.lead_id,
        coalesce(c.company_name, l.company_name) as owner_name
      from meeting_notes m
      left join clients c on c.id = m.client_id
      left join leads l on l.id = m.lead_id
      where m.business_id = ${businessId}
        and m.meeting_date between ${from} and ${to}
        and (
          ${filters.accessibleClientIds ?? null}::uuid[] is null
          or m.client_id is null
          or m.client_id = any(${filters.accessibleClientIds ?? null}::uuid[])
        )
    `,
    sql`
      select t.id, t.due_date as date, t.title, t.status, t.client_id, t.lead_id,
        coalesce(c.company_name, l.company_name) as owner_name
      from todos t
      left join clients c on c.id = t.client_id
      left join leads l on l.id = t.lead_id
      where t.business_id = ${businessId}
        and t.owned_by = 'TEAM'
        and t.due_date is not null and t.due_date between ${from} and ${to}
        and (${filters.restrictToTeamMemberId ?? null}::uuid is null or t.assigned_to_team_member_id = ${filters.restrictToTeamMemberId ?? null})
    `,
    sql`
      select cfe.id, (cfe.start_at at time zone ${timezone})::date as date, cfe.title, cfe.all_day,
        to_char(cfe.start_at at time zone ${timezone}, 'HH24:MI:SS') as start_time_text,
        coalesce(tm.name, b.owner_name) as owner_name
      from calendar_feed_events cfe
      join calendar_feeds cf on cf.id = cfe.feed_id
      left join team_members tm on tm.id = cf.team_member_id
      left join businesses b on b.id = cf.business_id
      where cfe.business_id = ${businessId}
        and (cfe.start_at at time zone ${timezone})::date between ${from} and ${to}
        and (
          ${filters.restrictToTeamMemberId ?? null}::uuid is null
          or cf.team_member_id = ${filters.restrictToTeamMemberId ?? null}
        )
    `,
  ]);

  const events: CalendarEvent[] = [];

  for (const r of followUpRows) {
    const row = r as Record<string, unknown>;
    const href = row.client_id ? `/clients/${row.client_id}` : `/leads/${row.lead_id}`;
    events.push({
      id: row.id as string,
      kind: "FOLLOW_UP",
      date: formatDateInput(row.date as string | Date),
      title: row.label as string,
      time: null,
      ownerName: (row.owner_name as string | null) ?? null,
      href,
      completed: false,
    });
  }

  for (const r of meetingRows) {
    const row = r as Record<string, unknown>;
    const href = row.client_id ? `/clients/${row.client_id}` : `/leads/${row.lead_id}`;
    events.push({
      id: row.id as string,
      kind: "MEETING",
      date: formatDateInput(row.date as string | Date),
      title: (row.title as string | null) ?? "Meeting",
      time: formatTime(row.start_time as string | null),
      ownerName: (row.owner_name as string | null) ?? null,
      href,
      completed: false,
    });
  }

  for (const r of taskRows) {
    const row = r as Record<string, unknown>;
    let href = "/todos";
    if (row.client_id) href = `/clients/${row.client_id}`;
    else if (row.lead_id) href = `/leads/${row.lead_id}`;
    events.push({
      id: row.id as string,
      kind: "TASK",
      date: formatDateInput(row.date as string | Date),
      title: row.title as string,
      time: null,
      ownerName: (row.owner_name as string | null) ?? null,
      href,
      completed: row.status === "COMPLETED",
    });
  }

  for (const r of externalRows) {
    const row = r as Record<string, unknown>;
    events.push({
      id: row.id as string,
      kind: "EXTERNAL",
      date: formatDateInput(row.date as string | Date),
      title: row.title as string,
      time: row.all_day ? null : formatTime(row.start_time_text as string | null),
      ownerName: (row.owner_name as string | null) ?? null,
      href: null,
      completed: false,
    });
  }

  return events;
}
