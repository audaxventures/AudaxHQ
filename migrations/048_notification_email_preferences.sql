-- Per-user email notification preferences for the three event-triggered
-- notification types (see migrations 032/034 — TASK_ASSIGNED,
-- FOLLOW_UP_ASSIGNED, MENTION). Each toggle defaults to true, matching the
-- product decision that email notifications are opt-out, not opt-in.
--
-- Owner preferences live on businesses (the owner isn't guaranteed to have
-- a linked team_members row — see businesses.owner_team_member_id, which is
-- nullable); every other recipient is a team_members row. This mirrors the
-- same null-means-owner split already used by
-- notifications.recipient_team_member_id.
--
-- Run once: psql "$DATABASE_URL" -f migrations/048_notification_email_preferences.sql

begin;

alter table businesses add column owner_notify_task_assigned boolean not null default true;
alter table businesses add column owner_notify_followup_assigned boolean not null default true;
alter table businesses add column owner_notify_mention boolean not null default true;

alter table team_members add column notify_task_assigned boolean not null default true;
alter table team_members add column notify_followup_assigned boolean not null default true;
alter table team_members add column notify_mention boolean not null default true;

commit;
