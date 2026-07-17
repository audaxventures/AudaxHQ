import { sql } from "@/lib/db";
import type { Notification, NotificationType, RightNowItem } from "@/lib/types";

interface NotificationRow {
  id: string;
  type: NotificationType;
  message: string;
  link: string | null;
  created_at: string;
  read_at: string | null;
}

function mapNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    type: row.type,
    message: row.message,
    link: row.link,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

/**
 * Inserted synchronously by the assignment actions themselves (createTask,
 * updateTask, addFollowUp, setFollowUpAssignee) — there's no background job
 * in this app, so this is the only way a row ever lands here.
 * `recipientTeamMemberId` follows the null-means-owner convention used
 * everywhere else (assigned_to_team_member_id).
 */
export async function createNotification(
  businessId: string,
  recipientTeamMemberId: string | null,
  type: NotificationType,
  message: string,
  link: string
): Promise<void> {
  await sql`
    insert into notifications (business_id, recipient_team_member_id, type, message, link)
    values (${businessId}, ${recipientTeamMemberId}, ${type}, ${message}, ${link})
  `;
}

export interface NotificationSnapshot {
  unread: Notification[];
  unreadCount: number;
  /** Live-computed, never persisted — see migration 032's header comment. */
  rightNow: RightNowItem[];
}

/**
 * Everything the notification bell needs in one call: unread "assigned to
 * you" events (persisted) plus a live "needs attention right now" list
 * (overdue/due-today items assigned to the viewer — never persisted, since
 * there's no cron to keep a stored copy fresh). `accessibleClientIds`
 * mirrors listHotFollowUps' team-member scoping; todos aren't client-access
 * scoped (see getDashboardData), so it's only applied to the follow-up query.
 */
export async function getNotificationSnapshot(
  businessId: string,
  recipientTeamMemberId: string | null,
  today: string,
  accessibleClientIds: string[] | null
): Promise<NotificationSnapshot> {
  const [unreadRows, unreadCountRows, taskRows, followUpRows] = await Promise.all([
    sql`
      select id, type, message, link, created_at, read_at from notifications
      where business_id = ${businessId}
        and recipient_team_member_id is not distinct from ${recipientTeamMemberId}::uuid
        and read_at is null
      order by created_at desc
      limit 20
    `,
    sql`
      select count(*)::int as count from notifications
      where business_id = ${businessId}
        and recipient_team_member_id is not distinct from ${recipientTeamMemberId}::uuid
        and read_at is null
    `,
    sql`
      select id, title, due_date from todos
      where business_id = ${businessId} and owned_by = 'TEAM' and status <> 'COMPLETED'
        and assigned_to_team_member_id is not distinct from ${recipientTeamMemberId}::uuid
        and due_date is not null and due_date <= ${today}::date
      order by due_date asc
      limit 10
    `,
    sql`
      select f.id, f.label, f.date, f.client_id, f.lead_id
      from follow_ups f
      where f.business_id = ${businessId} and f.status = 'UPCOMING' and f.date <= ${today}::date
        and f.assigned_to_team_member_id is not distinct from ${recipientTeamMemberId}::uuid
        and (
          ${accessibleClientIds ?? null}::uuid[] is null
          or f.client_id is null
          or f.client_id = any(${accessibleClientIds ?? null}::uuid[])
        )
      order by f.date asc
      limit 10
    `,
  ]);

  const rightNow: RightNowItem[] = [
    ...(taskRows as unknown as { id: string; title: string; due_date: string }[]).map((r) => ({
      id: `task:${r.id}`,
      label: r.title,
      link: "/todos",
      kind: "task" as const,
      isOverdue: r.due_date < today,
    })),
    ...(followUpRows as unknown as { id: string; label: string; date: string; client_id: string | null; lead_id: string | null }[]).map(
      (r) => ({
        id: `follow-up:${r.id}`,
        label: r.label,
        link: r.client_id ? `/clients/${r.client_id}` : `/leads/${r.lead_id}`,
        kind: "follow-up" as const,
        isOverdue: r.date < today,
      })
    ),
  ];

  return {
    unread: (unreadRows as unknown as NotificationRow[]).map(mapNotification),
    unreadCount: Number((unreadCountRows[0] as Record<string, unknown>).count),
    rightNow,
  };
}

export async function markNotificationRead(id: string, businessId: string, recipientTeamMemberId: string | null): Promise<void> {
  await sql`
    update notifications set read_at = now()
    where id = ${id} and business_id = ${businessId}
      and recipient_team_member_id is not distinct from ${recipientTeamMemberId}::uuid
  `;
}

export async function markAllNotificationsRead(businessId: string, recipientTeamMemberId: string | null): Promise<void> {
  await sql`
    update notifications set read_at = now()
    where business_id = ${businessId}
      and recipient_team_member_id is not distinct from ${recipientTeamMemberId}::uuid
      and read_at is null
  `;
}
