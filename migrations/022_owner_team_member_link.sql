-- Audax HQ — some owners create a team_members row for themselves (e.g. to
-- track their own billable hours in the tracker), which produces a second,
-- distinct identity for the same physical person alongside their OWNER
-- login (assigned_to_team_member_id = null conventionally means "the
-- owner"). Assigning a to-do/follow-up to that shadow row instead of the
-- owner's actual identity made it invisible on the owner's own board.
--
-- This column lets the owner explicitly link one team_members row as "me"
-- (via Settings > Team Members). Once linked, assignment writes normalize
-- a selection of that row down to null, so it behaves identically to
-- picking "Owner" everywhere the app already treats null as "the owner."
--
-- Best-effort backfill: auto-link any existing team_members row whose
-- name or email already matches the business owner's, so businesses that
-- happen to have an exact match don't need to do anything manually.
--
-- Not breaking, purely additive.
--
-- Run once: psql "$DATABASE_URL" -f migrations/022_owner_team_member_link.sql

alter table businesses add column owner_team_member_id uuid references team_members(id) on delete set null;

update businesses b
set owner_team_member_id = tm.id
from team_members tm
where tm.business_id = b.id
  and b.owner_team_member_id is null
  and (
    trim(lower(tm.name)) = trim(lower(b.owner_name))
    or (tm.email is not null and trim(lower(tm.email)) = trim(lower(b.owner_email)))
  );
