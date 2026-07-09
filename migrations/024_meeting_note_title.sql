-- Audax HQ — lets a meeting note have its own title, shown as the primary
-- heading on the meeting notes list instead of just the client/lead name
-- (which still shows alongside it as a tag). Nullable: existing notes have
-- no title yet, and the UI falls back to the client/lead name for those.
--
-- Not breaking, purely additive.
--
-- Run once: psql "$DATABASE_URL" -f migrations/024_meeting_note_title.sql

alter table meeting_notes add column title text;
