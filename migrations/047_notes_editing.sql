-- Verclara — two changes:
--
-- 1. Adds a real "Notes & Activity" log to Partners (partner_notes),
--    mirroring client_notes/lead_notes exactly (same columns, same author
--    attribution added by migration 034) — Partners previously only had a
--    single free-text `notes` field on the record itself, unlike
--    Clients/Leads. Any existing text in that field is carried over as
--    that partner's first log entry so nothing is lost, then the old
--    column is dropped — one notes concept per record type, matching
--    Clients/Leads. See src/lib/data/partners.ts, src/app/(app)/partners/
--    actions.ts, and the new "Notes & Activity" tab on the partner detail
--    page.
--
-- 2. (No schema change) Client/lead/partner notes gain the ability to be
--    edited after being added, not just added — see updateClientNote/
--    updateLeadNote/updatePartnerNote in the respective actions.ts files
--    and the edit affordance in src/components/NotesLog.tsx.
--
-- Not breaking — existing partner notes text is preserved as a log entry,
-- not discarded.
--
-- Run once: psql "$DATABASE_URL" -f migrations/047_notes_editing.sql

create table partner_notes (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  author_team_member_id uuid references team_members(id) on delete set null
);
create index idx_partner_notes_partner on partner_notes(partner_id);

insert into partner_notes (partner_id, business_id, body, created_at)
select id, business_id, notes, created_at from partners where notes is not null and trim(notes) <> '';

alter table partners drop column notes;
