-- Audax HQ — the app computed "today" in UTC everywhere (Postgres session
-- clock, plus several UTC-forced JS date calcs), which drifts a calendar day
-- off from the operator's actual local date for evening/night hours in any
-- timezone behind UTC. Add a configurable IANA timezone to the profile
-- singleton so "today" can be computed against the operator's real clock.
--
-- Run once: psql "$DATABASE_URL" -f migrations/010_profile_timezone.sql

alter table profile add column timezone text not null default 'UTC';
