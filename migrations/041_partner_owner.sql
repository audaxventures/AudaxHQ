-- Verclara — Partnerships feature, part 2: extends the existing
-- polymorphic client_id/lead_id "owner" pattern on meeting_notes,
-- follow_ups, documents, and todos with a third nullable partner_id,
-- so meetings/notes/tasks/documents can be attached directly to a
-- partner (not tied to any one referral). Precedented by migration 016,
-- which added lead_id to documents the same way.
--
-- Run once: psql "$DATABASE_URL" -f migrations/041_partner_owner.sql

begin;

alter table follow_ups add column partner_id uuid references partners(id) on delete cascade;
alter table follow_ups drop constraint follow_ups_one_owner;
alter table follow_ups add constraint follow_ups_one_owner check (
  (client_id is not null and lead_id is null and partner_id is null) or
  (client_id is null and lead_id is not null and partner_id is null) or
  (client_id is null and lead_id is null and partner_id is not null)
);
create index idx_follow_ups_partner on follow_ups(partner_id);

alter table meeting_notes add column partner_id uuid references partners(id) on delete cascade;
alter table meeting_notes drop constraint meeting_notes_one_owner;
alter table meeting_notes add constraint meeting_notes_one_owner check (
  (client_id is not null and lead_id is null and partner_id is null) or
  (client_id is null and lead_id is not null and partner_id is null) or
  (client_id is null and lead_id is null and partner_id is not null)
);
create index idx_meeting_notes_partner on meeting_notes(partner_id);

alter table documents add column partner_id uuid references partners(id) on delete cascade;
alter table documents drop constraint documents_one_owner;
alter table documents add constraint documents_one_owner check (
  (client_id is not null and lead_id is null and partner_id is null) or
  (client_id is null and lead_id is not null and partner_id is null) or
  (client_id is null and lead_id is null and partner_id is not null)
);
create index idx_documents_partner on documents(partner_id);

alter table todos add column partner_id uuid references partners(id) on delete cascade;
alter table todos drop constraint todos_type_link_check;
alter table todos add constraint todos_type_link_check check (
  (type = 'CLIENT' and client_id is not null and lead_id is null and partner_id is null and todo_type_id is null) or
  (type = 'LEAD' and lead_id is not null and client_id is null and partner_id is null and todo_type_id is null) or
  (type = 'PARTNER' and partner_id is not null and client_id is null and lead_id is null and todo_type_id is null) or
  (type = 'CUSTOM' and client_id is null and lead_id is null and partner_id is null and todo_type_id is not null)
);
create index idx_todos_partner on todos(partner_id);

commit;
