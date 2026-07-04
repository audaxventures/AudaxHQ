import { sql } from "@/lib/db";

export type CalendarEventKind = "FOLLOW_UP" | "MEETING" | "TASK";

export const CALENDAR_EVENT_KIND_LABELS: Record<CalendarEventKind, string> = {
  FOLLOW_UP: "Follow-up",
  MEETING: "Meeting",
  TASK: "Task",
};

export const CALENDAR_EVENT_KIND_ORDER: CalendarEventKind[] = ["FOLLOW_UP", "MEETING", "TASK"];

export interface CalendarEvent {
  id: string;
  kind: CalendarEventKind;
  date: string;
  title: string;
  ownerName: string | null;
  href: string;
  completed: boolean;
}

export async function listCalendarEvents(from: string, to: string): Promise<CalendarEvent[]> {
  const [followUpRows, meetingRows, taskRows] = await Promise.all([
    sql`
      select f.id, f.date, f.label, f.client_id, f.lead_id,
        coalesce(c.company_name, l.company_name) as owner_name
      from follow_ups f
      left join clients c on c.id = f.client_id
      left join leads l on l.id = f.lead_id
      where f.status = 'UPCOMING' and f.date between ${from} and ${to}
    `,
    sql`
      select m.id, m.meeting_date as date, m.client_id, m.lead_id,
        coalesce(c.company_name, l.company_name) as owner_name
      from meeting_notes m
      left join clients c on c.id = m.client_id
      left join leads l on l.id = m.lead_id
      where m.meeting_date between ${from} and ${to}
    `,
    sql`
      select t.id, t.due_date as date, t.title, t.status, t.client_id, t.lead_id,
        coalesce(c.company_name, l.company_name) as owner_name
      from todos t
      left join clients c on c.id = t.client_id
      left join leads l on l.id = t.lead_id
      where t.due_date is not null and t.due_date between ${from} and ${to}
    `,
  ]);

  const events: CalendarEvent[] = [];

  for (const r of followUpRows) {
    const row = r as Record<string, unknown>;
    const href = row.client_id ? `/clients/${row.client_id}` : `/leads/${row.lead_id}`;
    events.push({
      id: row.id as string,
      kind: "FOLLOW_UP",
      date: row.date as string,
      title: row.label as string,
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
      date: row.date as string,
      title: "Meeting notes",
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
      date: row.date as string,
      title: row.title as string,
      ownerName: (row.owner_name as string | null) ?? null,
      href,
      completed: row.status === "COMPLETED",
    });
  }

  return events;
}
