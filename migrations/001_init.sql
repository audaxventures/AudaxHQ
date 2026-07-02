-- Audax HQ initial schema
-- Run against your Neon / Vercel Postgres database before first deploy.
-- See README.md for instructions.

create extension if not exists pgcrypto;

create type client_type as enum ('PROJECT', 'RECURRING');
create type client_status as enum ('ACTIVE', 'PAUSED', 'CHURNED');
create type invoice_status as enum ('NOT_INVOICED', 'INVOICED', 'PAID');
create type lead_status as enum ('NEW', 'CONTACTED', 'PROPOSAL_SENT', 'NEGOTIATING', 'WON', 'LOST');
create type todo_status as enum ('OPEN', 'DONE');

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  contact_email text,
  contact_phone text,
  type client_type not null default 'PROJECT',
  status client_status not null default 'ACTIVE',
  rate numeric(12, 2) not null default 0,
  start_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table client_links (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  label text not null,
  url text not null,
  created_at timestamptz not null default now()
);

create table client_tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table client_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table project_invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references clients(id) on delete cascade,
  amount numeric(12, 2) not null default 0,
  status invoice_status not null default 'NOT_INVOICED',
  invoiced_date date,
  paid_date date
);

create table recurring_invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  period_month integer not null check (period_month between 1 and 12),
  period_year integer not null,
  amount numeric(12, 2) not null default 0,
  status invoice_status not null default 'NOT_INVOICED',
  invoiced_date date,
  paid_date date,
  created_at timestamptz not null default now(),
  unique (client_id, period_year, period_month)
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  contact_email text,
  contact_phone text,
  status lead_status not null default 'NEW',
  estimated_value numeric(12, 2),
  next_follow_up_date date,
  converted_client_id uuid references clients(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table todos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  due_date date,
  status todo_status not null default 'OPEN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table todo_tags (
  todo_id uuid not null references todos(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (todo_id, tag_id)
);

create index idx_client_tasks_client on client_tasks(client_id);
create index idx_client_notes_client on client_notes(client_id);
create index idx_recurring_invoices_client on recurring_invoices(client_id);
create index idx_lead_notes_lead on lead_notes(lead_id);
create index idx_leads_follow_up on leads(next_follow_up_date);
create index idx_todos_status on todos(status);
create index idx_todos_due on todos(due_date);
