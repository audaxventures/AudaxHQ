-- Verclara — lets each person pick a colour for their own note folders
-- (Notes page sidebar, folder chips on notes, folder header). Null keeps
-- the automatic colour picked from the folder's name. Same colour names as
-- clients/leads (src/lib/types.ts EntityColor), minus teal, which the Notes
-- page keeps for private notes.
--
-- Not breaking — existing folders keep their automatic colour.
--
-- Run once: psql "$DATABASE_URL" -f migrations/053_note_folder_color.sql

alter table note_folders add column color text check (
  color in ('navy', 'slate', 'blue', 'sage', 'burnt', 'gold', 'brick', 'rose', 'violet')
);
