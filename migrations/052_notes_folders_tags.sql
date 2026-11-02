-- Verclara — Meeting Notes becomes "Notes": private notes, folders, tags.
--
-- 1. A note no longer has to belong to a client, lead or partner. A note
--    with none of the three is a PRIVATE note: only its author can see it
--    (owner or team member). author_team_member_id records who that is —
--    null on a private note means the workspace owner. It's only ever set
--    on private notes (see the check constraint), and cascades on delete so
--    a removed team member's private notes go with them rather than being
--    orphaned onto the owner.
--
-- 2. Folders (note_folders) and tags (note_tags) are personal: each person
--    has their own, and files/tags any note they can see. team_member_id
--    null = the workspace owner. Folders allow one level of nesting
--    (enforced in src/lib/actions/meetingnotes.ts). A note sits in at most
--    one of a person's folders (note_folder_items, unique per note+person).
--
-- Not breaking — every existing note already has an owner, so all of them
-- keep their current visibility.
--
-- Run once: psql "$DATABASE_URL" -f migrations/052_notes_folders_tags.sql

begin;

alter table meeting_notes drop constraint meeting_notes_one_owner;
alter table meeting_notes add constraint meeting_notes_one_owner check (num_nonnulls(client_id, lead_id, partner_id) <= 1);

alter table meeting_notes add column author_team_member_id uuid references team_members(id) on delete cascade;
alter table meeting_notes add constraint meeting_notes_author_private_only check (
  author_team_member_id is null or (client_id is null and lead_id is null and partner_id is null)
);
create index idx_meeting_notes_private on meeting_notes(business_id, author_team_member_id)
  where client_id is null and lead_id is null and partner_id is null;

create table note_folders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  team_member_id uuid references team_members(id) on delete cascade,
  parent_id uuid references note_folders(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index idx_note_folders_owner on note_folders(business_id, team_member_id);

create table note_folder_items (
  meeting_note_id uuid not null references meeting_notes(id) on delete cascade,
  folder_id uuid not null references note_folders(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  team_member_id uuid references team_members(id) on delete cascade
);
create unique index note_folder_items_one_per_person on note_folder_items(
  meeting_note_id, coalesce(team_member_id, '00000000-0000-0000-0000-000000000000'::uuid)
);
create index idx_note_folder_items_folder on note_folder_items(folder_id);

create table note_tags (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  team_member_id uuid references team_members(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create unique index note_tags_name_per_person on note_tags(
  business_id, coalesce(team_member_id, '00000000-0000-0000-0000-000000000000'::uuid), name
);

create table meeting_note_tags (
  meeting_note_id uuid not null references meeting_notes(id) on delete cascade,
  tag_id uuid not null references note_tags(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  primary key (meeting_note_id, tag_id)
);
create index idx_meeting_note_tags_tag on meeting_note_tags(tag_id);

commit;
