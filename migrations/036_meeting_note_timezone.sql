-- Verclara — lets a meeting note record which timezone its scheduled time is
-- in. A business meeting clients across timezones needs a bare wall-clock
-- start_time labeled, since "2:00 PM" alone is ambiguous. Purely
-- descriptive: start_time stays a plain wall-clock value, this just tags
-- which zone it's in for display (on the note itself and its PDF export).
--
-- Not breaking, purely additive.
--
-- Run once: psql "$DATABASE_URL" -f migrations/036_meeting_note_timezone.sql

alter table meeting_notes add column timezone text;
