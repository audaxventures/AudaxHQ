-- Audax HQ — extends document storage to leads, matching the client_id/
-- lead_id shared-ownership pattern already used by follow_ups and
-- meeting_notes. Existing rows are all client-owned and are untouched by
-- this migration. Lead document files live in a separate private Supabase
-- Storage bucket, `lead-documents` — see README.md for setup steps.
--
-- Run once: psql "$DATABASE_URL" -f migrations/016_lead_documents.sql

alter table documents alter column client_id drop not null;
alter table documents add column lead_id uuid references leads(id) on delete cascade;
alter table documents add constraint documents_one_owner check (
  (client_id is not null and lead_id is null) or (client_id is null and lead_id is not null)
);
create index idx_documents_lead on documents(lead_id);
