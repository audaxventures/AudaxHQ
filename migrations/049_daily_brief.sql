-- Daily Brief — phase 2 of the notifications work (see migration 048). A
-- morning email per user summarizing overdue/due-today/upcoming tasks and
-- follow-ups, sent by an hourly external trigger (see
-- src/app/api/cron/daily-brief/route.ts) that checks each business's own
-- timezone and only fires once that business's local hour matches its send
-- hour. daily_brief_last_sent_date is the guard against double-sending if
-- two hourly runs both land in the matching hour window (e.g. a slightly
-- late/early trigger) — checked and set atomically per business per run,
-- not per user, since every opted-in user in a business is sent together
-- in one run.
--
-- Run once: psql "$DATABASE_URL" -f migrations/049_daily_brief.sql

begin;

alter table businesses add column owner_notify_daily_brief boolean not null default true;
alter table businesses add column daily_brief_send_hour smallint not null default 7 check (daily_brief_send_hour between 0 and 23);
alter table businesses add column daily_brief_last_sent_date date;

alter table team_members add column notify_daily_brief boolean not null default true;

commit;
