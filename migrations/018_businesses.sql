-- Audax HQ — Stage 1 of the multi-tenant conversion: introduces a
-- `businesses` table (the tenant), a global `account_emails` login-
-- resolution index, and a `business_id` column on every tenant-scoped
-- table. This migration is schema-only — it backfills the single
-- existing business from `profile`/`app_settings` and leaves the app
-- behaviorally single-tenant (exactly one business row exists after
-- this runs). Query-level `business_id` scoping is a later stage; this
-- migration just lays the foundation and is safe to run against a live,
-- single-tenant deployment.
--
-- PRE-FLIGHT: this migration requires app_settings.passcode_hash to
-- already be set (Settings → Passcode) — the global APP_PASSCODE env
-- var fallback is being retired for the new tenant-aware login path,
-- since once passcode storage is per-business, a business with no
-- DB-stored passcode would otherwise authenticate against one shared
-- secret usable against every business on the platform. The migration
-- aborts loudly if this precondition isn't met.
--
-- Run once: psql "$DATABASE_URL" -f migrations/018_businesses.sql

begin;

-- ---------------------------------------------------------------------
-- Avoid a naming collision: `business_entities` (the existing per-owner
-- picklist of "which of my own companies is this client billed under" —
-- Audax Ventures / H2MB) is unrelated to tenancy. Renaming it up front
-- keeps "business" unambiguous for the new tenant concept below.
-- ---------------------------------------------------------------------
alter table business_entities rename to billing_entities;

-- ---------------------------------------------------------------------
-- The tenant table. Merges `profile` (operator identity/timezone) and
-- `app_settings` (invoice-aging thresholds, passcode, logo) into one
-- row per business — both were hard singletons (id boolean primary key
-- default true) that can't become multi-row via ALTER.
-- ---------------------------------------------------------------------
create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_name text not null,
  owner_email text not null,
  owner_passcode_hash text not null,
  owner_passcode_salt text not null,
  owner_passcode_reset_token_hash text,
  owner_passcode_reset_token_expires_at timestamptz,
  timezone text not null default 'UTC',
  logo_path text,
  invoice_aging_under_days integer not null default 15,
  invoice_aging_over_days integer not null default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Global login-resolution index: given just an email (no business
-- selector), this is what tells login() which business + role +
-- credential to verify against. A real primary key here gives atomic,
-- race-free global uniqueness — checking two tables in app code before
-- insert can't do that over the Neon HTTP driver's stateless requests.
create table account_emails (
  email text primary key,
  business_id uuid not null references businesses(id) on delete cascade,
  role text not null check (role in ('OWNER', 'TEAM_MEMBER')),
  team_member_id uuid references team_members(id) on delete cascade,
  check ((role = 'OWNER') = (team_member_id is null))
);

do $$
begin
  if not exists (select 1 from app_settings where id = true and passcode_hash is not null) then
    raise exception 'app_settings.passcode_hash is not set. Set a DB-managed passcode via Settings > Passcode before running this migration — the global APP_PASSCODE fallback is being retired for the new tenant-aware login path.';
  end if;
end $$;

insert into businesses (
  name, owner_name, owner_email, owner_passcode_hash, owner_passcode_salt,
  owner_passcode_reset_token_hash, owner_passcode_reset_token_expires_at,
  timezone, logo_path, invoice_aging_under_days, invoice_aging_over_days
)
select
  'Audax Ventures', p.name, lower(trim(p.email)), a.passcode_hash, a.passcode_salt,
  a.passcode_reset_token_hash, a.passcode_reset_token_expires_at,
  p.timezone, a.logo_path, a.invoice_aging_under_days, a.invoice_aging_over_days
from profile p, app_settings a
where p.id = true and a.id = true;

insert into account_emails (email, business_id, role)
select owner_email, id, 'OWNER' from businesses;

-- ---------------------------------------------------------------------
-- team_members: gains business_id, email uniqueness becomes per-business
-- (global uniqueness for login purposes is now enforced by account_emails
-- instead), casing normalized since it's about to become a global key.
-- ---------------------------------------------------------------------
alter table team_members add column business_id uuid references businesses(id) on delete cascade;
update team_members set business_id = (select id from businesses limit 1);
alter table team_members alter column business_id set not null;

update team_members set email = lower(trim(email)) where email is not null;

alter table team_members drop constraint team_members_email_key;
alter table team_members add constraint team_members_business_email_key unique (business_id, email);

insert into account_emails (email, business_id, role, team_member_id)
select email, business_id, 'TEAM_MEMBER', id from team_members
where email is not null and passcode_hash is not null;

-- ---------------------------------------------------------------------
-- Core entities gain business_id first, so the composite FKs below
-- (which reference clients(id, business_id) / leads(id, business_id))
-- have something to point at.
-- ---------------------------------------------------------------------
alter table clients add column business_id uuid references businesses(id) on delete cascade;
update clients set business_id = (select id from businesses limit 1);
alter table clients alter column business_id set not null;
alter table clients add constraint clients_id_business_uk unique (id, business_id);

alter table leads add column business_id uuid references businesses(id) on delete cascade;
update leads set business_id = (select id from businesses limit 1);
alter table leads alter column business_id set not null;
alter table leads add constraint leads_id_business_uk unique (id, business_id);

-- ---------------------------------------------------------------------
-- Every other business-owned table: add business_id, backfill, not null.
-- ---------------------------------------------------------------------
alter table client_links add column business_id uuid references businesses(id) on delete cascade;
update client_links set business_id = (select id from businesses limit 1);
alter table client_links alter column business_id set not null;

alter table client_notes add column business_id uuid references businesses(id) on delete cascade;
update client_notes set business_id = (select id from businesses limit 1);
alter table client_notes alter column business_id set not null;

alter table lead_notes add column business_id uuid references businesses(id) on delete cascade;
update lead_notes set business_id = (select id from businesses limit 1);
alter table lead_notes alter column business_id set not null;

alter table follow_ups add column business_id uuid references businesses(id) on delete cascade;
update follow_ups set business_id = (select id from businesses limit 1);
alter table follow_ups alter column business_id set not null;

alter table meeting_notes add column business_id uuid references businesses(id) on delete cascade;
update meeting_notes set business_id = (select id from businesses limit 1);
alter table meeting_notes alter column business_id set not null;

alter table invoices add column business_id uuid references businesses(id) on delete cascade;
update invoices set business_id = (select id from businesses limit 1);
alter table invoices alter column business_id set not null;

alter table todos add column business_id uuid references businesses(id) on delete cascade;
update todos set business_id = (select id from businesses limit 1);
alter table todos alter column business_id set not null;

alter table todo_tags add column business_id uuid references businesses(id) on delete cascade;
update todo_tags set business_id = (select id from businesses limit 1);
alter table todo_tags alter column business_id set not null;

alter table documents add column business_id uuid references businesses(id) on delete cascade;
update documents set business_id = (select id from businesses limit 1);
alter table documents alter column business_id set not null;

alter table time_entries add column business_id uuid references businesses(id) on delete cascade;
update time_entries set business_id = (select id from businesses limit 1);
alter table time_entries alter column business_id set not null;

alter table fixed_costs add column business_id uuid references businesses(id) on delete cascade;
update fixed_costs set business_id = (select id from businesses limit 1);
alter table fixed_costs alter column business_id set not null;

alter table work_categories add column business_id uuid references businesses(id) on delete cascade;
update work_categories set business_id = (select id from businesses limit 1);
alter table work_categories alter column business_id set not null;

alter table client_access add column business_id uuid references businesses(id) on delete cascade;
update client_access set business_id = (select id from businesses limit 1);
alter table client_access alter column business_id set not null;

-- ---------------------------------------------------------------------
-- Write-path integrity: a client-or-lead-owned row's business_id can
-- never silently drift from its parent's actual business_id, enforced
-- by Postgres itself rather than trusted application code. A composite
-- FK is satisfied whenever the referencing column is null, which is
-- exactly the normal case here (only one of client_id/lead_id is set).
-- ---------------------------------------------------------------------
alter table follow_ups
  add constraint follow_ups_client_business_fk foreign key (client_id, business_id) references clients(id, business_id),
  add constraint follow_ups_lead_business_fk foreign key (lead_id, business_id) references leads(id, business_id);

alter table meeting_notes
  add constraint meeting_notes_client_business_fk foreign key (client_id, business_id) references clients(id, business_id),
  add constraint meeting_notes_lead_business_fk foreign key (lead_id, business_id) references leads(id, business_id);

alter table time_entries
  add constraint time_entries_client_business_fk foreign key (client_id, business_id) references clients(id, business_id),
  add constraint time_entries_lead_business_fk foreign key (lead_id, business_id) references leads(id, business_id);

alter table fixed_costs
  add constraint fixed_costs_client_business_fk foreign key (client_id, business_id) references clients(id, business_id),
  add constraint fixed_costs_lead_business_fk foreign key (lead_id, business_id) references leads(id, business_id);

alter table documents
  add constraint documents_client_business_fk foreign key (client_id, business_id) references clients(id, business_id),
  add constraint documents_lead_business_fk foreign key (lead_id, business_id) references leads(id, business_id);

-- ---------------------------------------------------------------------
-- Lookup/picklist tables: name uniqueness becomes per-business. New
-- businesses get their own seeded copies of these (Stage 3, signup) —
-- not addressed here.
-- ---------------------------------------------------------------------
alter table work_types add column business_id uuid references businesses(id) on delete cascade;
update work_types set business_id = (select id from businesses limit 1);
alter table work_types alter column business_id set not null;
alter table work_types drop constraint work_types_name_key;
alter table work_types add constraint work_types_business_name_key unique (business_id, name);

alter table lead_sources add column business_id uuid references businesses(id) on delete cascade;
update lead_sources set business_id = (select id from businesses limit 1);
alter table lead_sources alter column business_id set not null;
alter table lead_sources drop constraint lead_sources_name_key;
alter table lead_sources add constraint lead_sources_business_name_key unique (business_id, name);

alter table todo_types add column business_id uuid references businesses(id) on delete cascade;
update todo_types set business_id = (select id from businesses limit 1);
alter table todo_types alter column business_id set not null;
alter table todo_types drop constraint todo_types_name_key;
alter table todo_types add constraint todo_types_business_name_key unique (business_id, name);

alter table tags add column business_id uuid references businesses(id) on delete cascade;
update tags set business_id = (select id from businesses limit 1);
alter table tags alter column business_id set not null;
alter table tags drop constraint tags_name_key;
alter table tags add constraint tags_business_name_key unique (business_id, name);

alter table billing_entities add column business_id uuid references businesses(id) on delete cascade;
update billing_entities set business_id = (select id from businesses limit 1);
alter table billing_entities alter column business_id set not null;

-- ---------------------------------------------------------------------
-- IMPORTANT — TEMPORARY: every business_id column just added is NOT
-- NULL with no default, which would break every existing INSERT
-- statement in the app immediately (they don't supply business_id yet —
-- that's Stage 2's job, not this migration's). Give each one a literal
-- default pointing at the single business seeded above, so existing
-- write paths keep working unchanged until Stage 2 updates them to pass
-- business_id explicitly. THIS DEFAULT MUST BE DROPPED before Stage 3
-- (signup) ships — otherwise a second business's inserts that forget to
-- specify business_id would silently default to this first business's
-- id instead of failing loudly, which is a real cross-tenant data leak,
-- not just a bug.
-- ---------------------------------------------------------------------
do $$
declare
  v_business_id uuid;
  v_table text;
begin
  select id into v_business_id from businesses limit 1;
  foreach v_table in array array[
    'team_members', 'clients', 'leads', 'client_links', 'client_notes', 'lead_notes',
    'follow_ups', 'meeting_notes', 'invoices', 'todos', 'todo_tags', 'documents',
    'time_entries', 'fixed_costs', 'work_categories', 'client_access',
    'work_types', 'lead_sources', 'todo_types', 'tags', 'billing_entities'
  ]
  loop
    execute format('alter table %I alter column business_id set default %L', v_table, v_business_id);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- profile/app_settings are now fully superseded by businesses.
-- ---------------------------------------------------------------------
drop table profile;
drop table app_settings;

commit;
