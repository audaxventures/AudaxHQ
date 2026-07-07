-- Audax HQ — adds dedicated agenda + action items fields to meeting notes,
-- separate from the general notes body, so an agenda can be written and
-- saved before a meeting happens, with notes/action items filled in after.
-- `notes` becomes optional to match, since an agenda-only note ahead of a
-- meeting is now a valid save.
--
-- Run once: psql "$DATABASE_URL" -f migrations/017_meeting_note_agenda.sql

alter table meeting_notes alter column notes drop not null;
alter table meeting_notes add column agenda text;
alter table meeting_notes add column action_items text;
