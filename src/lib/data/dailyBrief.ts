import { sql } from "@/lib/db";
import { sendDailyBriefEmail } from "@/lib/email";
import { formatDateInput } from "@/lib/format";

export interface DailyBriefItem {
  id: string;
  label: string;
  link: string;
  kind: "task" | "follow-up";
  dueDate: string;
}

export interface DailyBriefData {
  overdue: DailyBriefItem[];
  dueToday: DailyBriefItem[];
  /** Not-yet-due tasks/follow-ups, soonest first, capped — a forward look at what's coming, not just what's on fire today. */
  upcoming: DailyBriefItem[];
  /** Most recent notification messages for this recipient in the last 24h, capped — the rest is summarized by recentActivityCount. */
  recentActivity: string[];
  recentActivityCount: number;
}

const UPCOMING_LIMIT = 5;
const BUCKET_LIMIT = 8;

interface TaskRow {
  id: string;
  title: string;
  due_date: string | Date;
}

interface FollowUpRow {
  id: string;
  label: string;
  date: string | Date;
  client_id: string | null;
  lead_id: string | null;
  partner_id: string | null;
  prospect_id: string | null;
}

function followUpLink(row: FollowUpRow): string {
  if (row.client_id) return `/clients/${row.client_id}`;
  if (row.lead_id) return `/leads/${row.lead_id}`;
  if (row.partner_id) return `/partners/${row.partner_id}`;
  return `/prospects?open=${row.prospect_id}`;
}

/**
 * Everything the Daily Brief needs for one recipient: the same
 * overdue/due-today split the bell icon's "right now" panel already
 * computes (see getNotificationSnapshot in notifications.ts), plus a
 * forward-looking "upcoming" bucket that panel doesn't have, plus a light
 * recap of what happened in the last 24h. All live-computed, same as the
 * rest of this app's ambient notification state — nothing here is
 * persisted beyond the source todos/follow_ups/notifications rows
 * themselves.
 */
export async function getDailyBriefItems(
  businessId: string,
  recipientTeamMemberId: string | null,
  today: string
): Promise<DailyBriefData> {
  const [taskRows, followUpRows, activityRows, activityCountRows] = await Promise.all([
    sql`
      select id, title, due_date from todos
      where business_id = ${businessId} and owned_by = 'TEAM' and status <> 'COMPLETED'
        and assigned_to_team_member_id is not distinct from ${recipientTeamMemberId}::uuid
        and due_date is not null
      order by due_date asc
      limit 100
    `,
    sql`
      select id, label, date, client_id, lead_id, partner_id, prospect_id from follow_ups
      where business_id = ${businessId} and status = 'UPCOMING'
        and assigned_to_team_member_id is not distinct from ${recipientTeamMemberId}::uuid
      order by date asc
      limit 100
    `,
    sql`
      select message from notifications
      where business_id = ${businessId}
        and recipient_team_member_id is not distinct from ${recipientTeamMemberId}::uuid
        and created_at >= now() - interval '24 hours'
      order by created_at desc
      limit 3
    `,
    sql`
      select count(*)::int as count from notifications
      where business_id = ${businessId}
        and recipient_team_member_id is not distinct from ${recipientTeamMemberId}::uuid
        and created_at >= now() - interval '24 hours'
    `,
  ]);

  const items: (DailyBriefItem & { dueDate: string })[] = [
    ...(taskRows as unknown as TaskRow[]).map((r) => ({
      id: `task:${r.id}`,
      label: r.title,
      link: "/todos",
      kind: "task" as const,
      // due_date is a Postgres `date` column — the neon-serverless client
      // parses it into a JS Date, not the plain "YYYY-MM-DD" string its
      // column type suggests (same gotcha as meeting_notes.meeting_date,
      // see MeetingNotesSection.tsx), so it has to go through
      // formatDateInput before it can be compared against `today` as a
      // string.
      dueDate: formatDateInput(r.due_date),
    })),
    ...(followUpRows as unknown as FollowUpRow[]).map((r) => ({
      id: `follow-up:${r.id}`,
      label: r.label,
      link: followUpLink(r),
      kind: "follow-up" as const,
      dueDate: formatDateInput(r.date),
    })),
  ];

  const overdue = items.filter((i) => i.dueDate < today).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const dueToday = items.filter((i) => i.dueDate === today);
  const upcoming = items
    .filter((i) => i.dueDate > today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, UPCOMING_LIMIT);

  return {
    overdue: overdue.slice(0, BUCKET_LIMIT),
    dueToday: dueToday.slice(0, BUCKET_LIMIT),
    upcoming,
    recentActivity: (activityRows as unknown as { message: string }[]).map((r) => r.message),
    recentActivityCount: Number((activityCountRows[0] as Record<string, unknown>).count),
  };
}

/** Assembles and sends one recipient's Daily Brief — the shared step between the hourly cron sweep (api/cron/daily-brief) and the "send me a test brief" button in Settings > Notifications. Not preference-gated itself; callers decide who's eligible before reaching here. */
export async function sendDailyBriefToRecipient(
  businessId: string,
  today: string,
  recipient: { teamMemberId: string | null; email: string; name: string }
): Promise<void> {
  const data = await getDailyBriefItems(businessId, recipient.teamMemberId, today);
  await sendDailyBriefEmail({
    to: recipient.email,
    recipientName: recipient.name,
    today,
    overdue: data.overdue,
    dueToday: data.dueToday,
    upcoming: data.upcoming,
    recentActivity: data.recentActivity,
    recentActivityCount: data.recentActivityCount,
  });
}
