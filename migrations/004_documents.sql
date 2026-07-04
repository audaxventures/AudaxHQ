-- Audax HQ — file/document storage per client.
--
-- Metadata only: the actual file bytes live in Supabase Storage (private
-- bucket `client-documents`), never in this table. `file_path` is the
-- object's path within that bucket, used to mint a signed URL on request
-- and to remove the object when the row is deleted. See README.md for
-- the Supabase setup steps this migration depends on.
--
-- Run once: psql "$DATABASE_URL" -f migrations/004_documents.sql

create table documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text not null,
  file_size bigint not null,
  label text,
  uploaded_by text not null default 'Joshua',
  created_at timestamptz not null default now()
);

create index idx_documents_client on documents(client_id);
