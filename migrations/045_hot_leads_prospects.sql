-- Verclara — lets a lead or prospect be flagged "hot" (needs focus / strong
-- potential), independent of its pipeline status. A plain boolean rather
-- than a priority scale — the ask is "which of these deserve extra
-- attention right now," a yes/no signal, not a ranked scale. Hot leads and
-- prospects sort to the top of their list ahead of the existing sort order
-- (see listLeads/listProspects in src/lib/data/leads.ts and prospects.ts),
-- toggled via a flame icon on each list row/card
-- (src/components/ui/HotToggle.tsx).
--
-- Not breaking, purely additive.
--
-- Run once: psql "$DATABASE_URL" -f migrations/045_hot_leads_prospects.sql

alter table leads add column hot boolean not null default false;
alter table prospects add column hot boolean not null default false;
