-- Adds author attribution to client/lead notes (so "Activity & notes" can
-- show who wrote each entry) and @mention support: an author tags a team
-- member inline in a note's body, which fires an in-app notification.
-- Mentions are encoded directly in the note body as `@[Name](id)` tokens
-- (parsed at render time for display and at write time to resolve
-- notification recipients) rather than a separate join table, since a
-- note's body is already the single source of truth for its content and
-- mentions never need to be queried independently of the note they're in.
--
-- Run once: psql "$DATABASE_URL" -f migrations/034_note_mentions.sql

alter table client_notes add column author_team_member_id uuid references team_members(id) on delete set null;
alter table lead_notes add column author_team_member_id uuid references team_members(id) on delete set null;

alter table notifications drop constraint notifications_type_check;
alter table notifications add constraint notifications_type_check
  check (type in ('TASK_ASSIGNED', 'FOLLOW_UP_ASSIGNED', 'MENTION'));
