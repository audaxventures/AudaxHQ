-- Audax HQ — Settings module, phase 1: profile identity, a business/entity
-- registry, and app-wide configuration (invoice aging thresholds, an
-- optional DB-managed passcode). Purely additive — no existing columns
-- or tables are touched.
--
-- Run once: psql "$DATABASE_URL" -f migrations/007_settings.sql

-- Singleton row holding the operator's display identity (used e.g. as
-- "uploaded by" on future documents, or report headers).
create table profile (
  id boolean primary key default true check (id),
  name text not null default '',
  email text not null default '',
  updated_at timestamptz not null default now()
);
insert into profile (id) values (true);

-- Business/entity names in use (e.g. Audax Ventures, H2MB). Seeded from
-- the same two names already hardcoded into the task_type enum, but this
-- list is managed independently going forward.
create table business_entities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  contact_info text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
insert into business_entities (name) values ('Audax Ventures'), ('H2MB');

-- Singleton row for app-wide configuration: invoice aging brackets
-- (previously hardcoded at 15/30 days) and an optional DB-managed
-- passcode (falls back to the APP_PASSCODE env var until one is set —
-- see src/lib/auth.ts).
create table app_settings (
  id boolean primary key default true check (id),
  invoice_aging_under_days integer not null default 15,
  invoice_aging_over_days integer not null default 30,
  passcode_hash text,
  passcode_salt text,
  updated_at timestamptz not null default now()
);
insert into app_settings (id) values (true);
