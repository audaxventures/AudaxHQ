-- Verclara — lets a lead be assigned a "Lead Owner" (a team member
-- responsible for it), separate from who a follow-up or to-do on that lead
-- is assigned to. Nullable: existing leads and newly created ones start
-- unassigned until someone claims them.
--
-- Not breaking, purely additive.
--
-- Run once: psql "$DATABASE_URL" -f migrations/037_lead_owner.sql

alter table leads add column lead_owner_team_member_id uuid references team_members(id) on delete set null;
