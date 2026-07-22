-- Records the most recent time a meeting note's branded PDF was emailed to
-- the client/lead, so the note UI can show "Emailed to jane@acme.com on
-- Jul 20" instead of leaving that with no visible trace. Only the latest
-- send is tracked (not a full history table) — see sendMeetingNoteEmail in
-- src/lib/actions/meetingnotes.ts.
--
-- Run once: psql "$DATABASE_URL" -f migrations/033_meeting_note_email_log.sql

alter table meeting_notes add column last_emailed_to text;
alter table meeting_notes add column last_emailed_at timestamptz;
