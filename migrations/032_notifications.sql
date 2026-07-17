-- In-app notifications — currently just "assigned to you by someone else"
-- events for tasks and follow-ups (see createNotification callers in
-- src/lib/actions/tasks.ts and src/lib/actions/followups.ts). There's no
-- background/cron job in this app, so this table only ever gets rows from
-- a synchronous insert alongside the assignment action itself — never from
-- a scheduled sweep. Time-based nudges (overdue/due-today) are deliberately
-- NOT stored here; they're computed live at read time in
-- getNotificationSnapshot() (src/lib/data/notifications.ts), since "overdue"
-- is ambient state that's always current, not a discrete event to mark read.
--
-- recipient_team_member_id follows the same null-means-owner convention used
-- by todos.assigned_to_team_member_id and follow_ups.assigned_to_team_member_id.
--
-- Run once: psql "$DATABASE_URL" -f migrations/032_notifications.sql

create table notifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  recipient_team_member_id uuid references team_members(id) on delete cascade,
  type text not null check (type in ('TASK_ASSIGNED', 'FOLLOW_UP_ASSIGNED')),
  message text not null,
  link text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

-- Powers "how many unread for me" + "most recent for me", the only two
-- access patterns this table serves.
create index notifications_recipient_unread_idx
  on notifications (business_id, recipient_team_member_id, read_at, created_at desc);
