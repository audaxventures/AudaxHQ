-- Verclara — Prospects: the funnel stage before a Lead. Tracks people
-- worth reaching out to before there's an active deal — lighter-weight
-- than a Lead (no pipeline value/stage/source), and deliberately has no
-- detail page (managed entirely from a drawer on the Prospects list
-- page). "Prospect owner" (owner_team_member_id) mirrors
-- leads.lead_owner_team_member_id (migration 037) — a simple ownership
-- tag, not a task-assignment relationship.
--
-- prospect_activity is a lightweight call/email/meeting/note log, kept
-- separate from lead_notes/client_notes since it's structured outreach
-- history (typed entries) rather than freeform notes.
--
-- Reuses the existing polymorphic client_id/lead_id/partner_id "owner"
-- pattern on follow_ups by adding a fourth nullable prospect_id column,
-- precedented by migration 041's partner_id addition — so a follow-up
-- reminder set on a prospect is the same follow_ups row the Follow-ups
-- page and dashboard already read, not a parallel field to keep in sync.
--
-- Run once: psql "$DATABASE_URL" -f migrations/043_prospects.sql

begin;

create table prospects (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  business_name text,
  title text,
  industry text,
  status text not null default 'NEW' check (status in ('NEW', 'CONTACTED', 'ATTEMPTED', 'QUALIFIED', 'NOT_INTERESTED', 'CONVERTED')),
  notes text,
  owner_team_member_id uuid references team_members(id) on delete set null,
  converted_lead_id uuid references leads(id) on delete set null,
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_prospects_business on prospects(business_id);
create index idx_prospects_owner on prospects(owner_team_member_id);
create index idx_prospects_status on prospects(status);

create table prospect_activity (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  prospect_id uuid not null references prospects(id) on delete cascade,
  type text not null check (type in ('CALL', 'EMAIL', 'MEETING', 'NOTE')),
  body text not null,
  logged_by_team_member_id uuid references team_members(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_prospect_activity_prospect on prospect_activity(prospect_id);

alter table follow_ups add column prospect_id uuid references prospects(id) on delete cascade;
alter table follow_ups drop constraint follow_ups_one_owner;
alter table follow_ups add constraint follow_ups_one_owner check (
  (client_id is not null and lead_id is null and partner_id is null and prospect_id is null) or
  (client_id is null and lead_id is not null and partner_id is null and prospect_id is null) or
  (client_id is null and lead_id is null and partner_id is not null and prospect_id is null) or
  (client_id is null and lead_id is null and partner_id is null and prospect_id is not null)
);
create index idx_follow_ups_prospect on follow_ups(prospect_id);

commit;
