-- Audax HQ — lets the operator (or a team member) mark who's responsible
-- for a follow-up, mirroring the to-do assignment model. null means
-- unassigned (matching every existing row unchanged).
--
-- Run once: psql "$DATABASE_URL" -f migrations/015_followup_assignment.sql

alter table follow_ups add column assigned_to_team_member_id uuid references team_members(id) on delete set null;
create index idx_follow_ups_assigned_to on follow_ups(assigned_to_team_member_id);
