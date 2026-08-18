-- Replaces partners' plain active/inactive boolean with a three-state
-- status (ACTIVE / POTENTIAL / INACTIVE), so a partner who's only had an
-- intro call can be tracked separately from one who's actively sending
-- referrals, without another archived-looking "inactive" toggle standing
-- in for "not confirmed yet".
--
-- Run once: psql "$DATABASE_URL" -f migrations/050_partner_status.sql

begin;

create type partner_status as enum ('ACTIVE', 'POTENTIAL', 'INACTIVE');

alter table partners add column status partner_status not null default 'ACTIVE';
update partners set status = (case when active then 'ACTIVE' else 'INACTIVE' end)::partner_status;
alter table partners drop column active;

commit;
