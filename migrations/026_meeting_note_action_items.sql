-- Links a to-do back to the meeting note it was quick-added from, so a
-- meeting note can show its action items as a live checklist instead of
-- static text. Nullable — most to-dos aren't created this way.
alter table todos add column meeting_note_id uuid references meeting_notes(id) on delete set null;
create index idx_todos_meeting_note on todos(meeting_note_id);
