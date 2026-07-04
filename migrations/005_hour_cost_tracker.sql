-- Audax HQ — Hour & Cost Tracker: time entries and fixed costs logged
-- against a client or lead, a lightweight team-member roster, and an
-- optional per-client hours budget.
--
-- Run once: psql "$DATABASE_URL" -f migrations/005_hour_cost_tracker.sql

create table team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_hourly_rate numeric(10, 2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table time_entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  team_member_id uuid not null references team_members(id),
  date date not null,
  hours numeric(6, 2) not null check (hours > 0),
  rate numeric(10, 2) not null default 0,
  billable boolean not null default true,
  description text,
  created_at timestamptz not null default now(),
  constraint time_entries_one_owner check (
    (client_id is not null and lead_id is null) or (client_id is null and lead_id is not null)
  )
);
create index idx_time_entries_client on time_entries(client_id);
create index idx_time_entries_lead on time_entries(lead_id);
create index idx_time_entries_team_member on time_entries(team_member_id);
create index idx_time_entries_date on time_entries(date);

create table fixed_costs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  date date not null,
  description text not null,
  amount numeric(12, 2) not null default 0,
  category text,
  created_at timestamptz not null default now(),
  constraint fixed_costs_one_owner check (
    (client_id is not null and lead_id is null) or (client_id is null and lead_id is not null)
  )
);
create index idx_fixed_costs_client on fixed_costs(client_id);
create index idx_fixed_costs_lead on fixed_costs(lead_id);
create index idx_fixed_costs_date on fixed_costs(date);

-- Optional target used to flag actual-vs-budget overrun on a client's
-- profitability summary. Leads don't get one — there's no committed scope
-- to budget against before they've converted.
alter table clients add column budgeted_hours numeric(8, 2);
