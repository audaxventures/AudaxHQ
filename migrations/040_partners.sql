-- Verclara — Partnerships / Referral Partners feature, part 1: the
-- partners table, leads.referred_by_partner_id, and partner_commissions.
--
-- partners tracks strategic referral partners — not clients, not leads.
-- Referrals reuse the existing lead pipeline via a new nullable
-- leads.referred_by_partner_id column, kept separate from source_id
-- (which stays the generic marketing-channel category): a referral is
-- just a lead tagged with which partner sent it, so it inherits the full
-- pipeline/kanban/win-rate tracking for free.
--
-- partner_commissions is a new table, not a repurposed invoices table:
-- invoices model money coming IN from clients (client_id not null,
-- always client-scoped); commissions model money owed OUT to partners,
-- and aren't always tied to one specific referral (e.g. a flat monthly
-- retainer), so referred_lead_id/referred_client_id are both nullable.
--
-- Run once: psql "$DATABASE_URL" -f migrations/040_partners.sql

begin;

create table partners (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  company_name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  commission_terms text,
  active boolean not null default true,
  color text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partners_id_business_uk unique (id, business_id)
);

create index idx_partners_business on partners(business_id);

alter table leads add column referred_by_partner_id uuid references partners(id) on delete set null;
create index idx_leads_referred_by_partner on leads(referred_by_partner_id);

create table partner_commissions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  partner_id uuid not null references partners(id) on delete cascade,
  referred_lead_id uuid references leads(id) on delete set null,
  referred_client_id uuid references clients(id) on delete set null,
  amount numeric(12, 2) not null default 0,
  status text not null default 'OWED' check (status in ('OWED', 'PAID')),
  description text,
  due_date date,
  paid_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_partner_commissions_business on partner_commissions(business_id);
create index idx_partner_commissions_partner on partner_commissions(partner_id);
create index idx_partner_commissions_status on partner_commissions(status);

commit;
