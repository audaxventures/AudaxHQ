-- Audax HQ — feature update: unified tasks, multi-invoices, follow-ups,
-- meeting notes, company-name-primary, lead work type/source.
--
-- ⚠️ BREAKING SCHEMA CHANGE. Run this against your database BEFORE
-- deploying the corresponding app code (the new code expects this schema
-- and will error against the old one; the old code will error against
-- this one). All existing data is migrated in place, nothing is lost.
--
-- Run once: psql "$DATABASE_URL" -f migrations/002_feature_update.sql

begin;

-- ---------------------------------------------------------------------
-- New enum types
-- ---------------------------------------------------------------------
create type task_type as enum ('CLIENT', 'LEAD', 'GENERAL', 'PERSONAL', 'AUDAX_VENTURES', 'H2MB', 'OTHER');
create type task_status as enum ('TO_BE_DONE', 'IN_PROGRESS', 'AWAITING_CLIENT_FEEDBACK', 'COMPLETED');
create type work_type as enum ('CUSTOM_SOFTWARE', 'WEB_APP', 'MOBILE_APP', 'INTERNAL_TOOL', 'WEBSITE', 'INTEGRATION_API', 'OTHER');
create type lead_source as enum ('REFERRAL', 'COLD_OUTREACH', 'RILEY_OUTREACH', 'AD', 'INBOUND', 'OTHER');
create type followup_status as enum ('UPCOMING', 'COMPLETED');

-- ---------------------------------------------------------------------
-- Clients & Leads: company_name becomes the primary identifier,
-- contact_name (formerly `name`) becomes secondary/optional.
-- ---------------------------------------------------------------------
alter table clients add column company_name text;
update clients set company_name = coalesce(nullif(company, ''), name);
alter table clients alter column company_name set not null;
alter table clients drop column company;
alter table clients rename column name to contact_name;
alter table clients alter column contact_name drop not null;

alter table leads add column company_name text;
update leads set company_name = coalesce(nullif(company, ''), name);
alter table leads alter column company_name set not null;
alter table leads drop column company;
alter table leads rename column name to contact_name;
alter table leads alter column contact_name drop not null;

-- Work type carries over from lead to client on conversion, so both
-- tables get it.
alter table clients add column work_type work_type;
alter table clients add column work_type_other text;
alter table leads add column work_type work_type;
alter table leads add column work_type_other text;
alter table leads add column source lead_source;
alter table leads add column source_other text;

-- ---------------------------------------------------------------------
-- Follow-ups (replaces leads.next_follow_up_date; new capability for
-- clients too), scoped to exactly one of client/lead.
-- ---------------------------------------------------------------------
create table follow_ups (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  label text not null,
  date date not null,
  status followup_status not null default 'UPCOMING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint follow_ups_one_owner check (
    (client_id is not null and lead_id is null) or (client_id is null and lead_id is not null)
  )
);
create index idx_follow_ups_client on follow_ups(client_id);
create index idx_follow_ups_lead on follow_ups(lead_id);
create index idx_follow_ups_date on follow_ups(date);

insert into follow_ups (lead_id, label, date, status)
select id, 'Follow up', next_follow_up_date, 'UPCOMING'
from leads
where next_follow_up_date is not null;

alter table leads drop column next_follow_up_date;

-- ---------------------------------------------------------------------
-- Meeting notes: new module, scoped to exactly one of client/lead.
-- ---------------------------------------------------------------------
create table meeting_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  meeting_date date not null,
  attendees text,
  notes text not null,
  created_at timestamptz not null default now(),
  constraint meeting_notes_one_owner check (
    (client_id is not null and lead_id is null) or (client_id is null and lead_id is not null)
  )
);
create index idx_meeting_notes_client on meeting_notes(client_id);
create index idx_meeting_notes_lead on meeting_notes(lead_id);
create index idx_meeting_notes_date on meeting_notes(meeting_date);

-- ---------------------------------------------------------------------
-- Invoices: one client-scoped list replacing project_invoices (single
-- record) and recurring_invoices (one row per month). Recurring
-- auto-generated rows keep period_month/period_year for their
-- once-per-month uniqueness guarantee; one-off invoices (deposits,
-- milestones, ad hoc project invoices) leave those null.
-- ---------------------------------------------------------------------
create table invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  label text not null,
  amount numeric(12, 2) not null default 0,
  status invoice_status not null default 'NOT_INVOICED',
  invoiced_date date,
  paid_date date,
  period_month integer check (period_month between 1 and 12),
  period_year integer,
  created_at timestamptz not null default now()
);
create index idx_invoices_client on invoices(client_id);
create unique index idx_invoices_recurring_period on invoices(client_id, period_year, period_month) where period_month is not null;

insert into invoices (client_id, label, amount, status, invoiced_date, paid_date, created_at)
select client_id, 'Project total', amount, status, invoiced_date, paid_date, now()
from project_invoices;

insert into invoices (client_id, label, amount, status, invoiced_date, paid_date, period_month, period_year, created_at)
select
  client_id,
  trim(to_char(to_date(period_month::text, 'MM'), 'Month')) || ' ' || period_year,
  amount, status, invoiced_date, paid_date, period_month, period_year, created_at
from recurring_invoices;

drop table project_invoices;
drop table recurring_invoices;

-- ---------------------------------------------------------------------
-- Unified tasks: todos absorbs client_tasks. Every task — general
-- to-do, client-linked, or lead-linked — lives in one table now.
-- ---------------------------------------------------------------------
alter table todos add column type task_type not null default 'GENERAL';
alter table todos add column client_id uuid references clients(id) on delete cascade;
alter table todos add column lead_id uuid references leads(id) on delete cascade;

alter table todos add column status_v2 task_status;
update todos set status_v2 = case when status = 'DONE' then 'COMPLETED'::task_status else 'TO_BE_DONE'::task_status end;
alter table todos alter column status_v2 set not null;
alter table todos alter column status_v2 set default 'TO_BE_DONE';
alter table todos drop column status;
alter table todos rename column status_v2 to status;
drop type todo_status;

alter table todos add constraint todos_type_link_check check (
  (type = 'CLIENT' and client_id is not null and lead_id is null) or
  (type = 'LEAD' and lead_id is not null and client_id is null) or
  (type not in ('CLIENT', 'LEAD') and client_id is null and lead_id is null)
);

insert into todos (title, type, client_id, status, created_at, updated_at)
select title, 'CLIENT', client_id,
  case when done then 'COMPLETED'::task_status else 'TO_BE_DONE'::task_status end,
  created_at, created_at
from client_tasks;

drop table client_tasks;

create index idx_todos_type on todos(type);
create index idx_todos_client on todos(client_id);
create index idx_todos_lead on todos(lead_id);

commit;
