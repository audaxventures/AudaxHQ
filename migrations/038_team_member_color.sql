-- Verclara — lets each team member get an explicit accent color, the same
-- way clients and leads already can (see migration 011). Used to make the
-- "Lead Owner" tag on the Leads list visually distinguish one owner from
-- another instead of every tag rendering identically.
--
-- Nullable: an unset color falls back to the existing hash-of-name color,
-- same fallback behavior as clients/leads.
--
-- Run once: psql "$DATABASE_URL" -f migrations/038_team_member_color.sql

alter table team_members add column color text;
