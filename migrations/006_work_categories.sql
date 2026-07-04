-- Audax HQ — work categories for time entries (e.g. Admin Hours,
-- Professional Development), each with its own default hourly rate so
-- hours can be sorted and billed by the type of work performed, not just
-- by team member. Nullable/optional at the DB level so existing entries
-- logged before this migration don't need a backfilled value.
--
-- Run once: psql "$DATABASE_URL" -f migrations/006_work_categories.sql

create table work_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_hourly_rate numeric(10, 2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table time_entries add column category_id uuid references work_categories(id);
create index idx_time_entries_category on time_entries(category_id);
