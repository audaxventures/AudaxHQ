-- Audax HQ — lets a meeting note represent a genuinely scheduled meeting
-- (with a time, duration, and location) rather than just a bare date. A
-- meeting note's lifecycle becomes: scheduled (these three set, notes
-- empty) -> happened (notes filled in) -- same record throughout, no new
-- table. All three are nullable so existing notes are unaffected.
--
-- Not breaking, purely additive.
--
-- Run once: psql "$DATABASE_URL" -f migrations/029_meeting_scheduling.sql

alter table meeting_notes add column start_time time;
alter table meeting_notes add column duration_minutes integer;
alter table meeting_notes add column location text;
