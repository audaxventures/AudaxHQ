-- Workspace feedback: owners and team members can submit feature requests
-- and bug reports from within their workspace; platform admins triage them
-- all in one place. submitted_by_name/role are denormalized at submission
-- time (not an FK to team_members) so a submission survives the submitter
-- later being deactivated or permanently deleted.

create table feedback (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  submitted_by_name text not null,
  submitted_by_role text not null check (submitted_by_role in ('OWNER', 'TEAM_MEMBER')),
  message text not null,
  status text not null default 'new' check (status in ('new', 'planned', 'done')),
  created_at timestamptz not null default now()
);

create index idx_feedback_business on feedback(business_id);
create index idx_feedback_status on feedback(status);
