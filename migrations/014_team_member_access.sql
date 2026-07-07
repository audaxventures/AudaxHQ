-- Audax HQ — lets the operator add teammates with their own login, scoped
-- to a subset of clients, unable to see client billing figures. Team
-- members already existed as labels for logging time against; this
-- extends that same table with optional login credentials rather than
-- introducing a second, separate "users" concept. A team member with no
-- passcode_hash has no login (unchanged legacy behavior — just a label).
--
-- Run once: psql "$DATABASE_URL" -f migrations/014_team_member_access.sql

alter table team_members add column email text unique;
alter table team_members add column passcode_hash text;
alter table team_members add column passcode_salt text;
alter table team_members add column passcode_reset_token_hash text;
alter table team_members add column passcode_reset_token_expires_at timestamptz;

-- Which clients a team member can see/work on. No row for a given
-- team member means no client access — deliberately opt-in, not opt-out.
create table client_access (
  team_member_id uuid not null references team_members(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (team_member_id, client_id)
);

-- Who a to-do is currently assigned to (null = the workspace owner,
-- matching every existing row unchanged) and who originally created it,
-- so teammates can hand tasks to each other/the owner without seeing one
-- another's boards.
alter table todos add column assigned_to_team_member_id uuid references team_members(id) on delete set null;
alter table todos add column created_by_team_member_id uuid references team_members(id) on delete set null;
create index idx_todos_assigned_to on todos(assigned_to_team_member_id);
