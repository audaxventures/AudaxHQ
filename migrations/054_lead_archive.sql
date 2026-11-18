-- Verclara — lets a lead be archived: shelved out of the main Leads list
-- without deleting it, for a "not now, maybe later" lead. Different from
-- status LOST (the deal is dead): archiving keeps the lead's pipeline stage
-- as it was, so unarchiving puts it straight back where it left off, and it
-- doesn't count as a loss in lead analytics.
--
-- archived_at null = active; set = archived (and when). While archived, the
-- lead is hidden from the Leads list (surfaced in the Archived drawer
-- instead), its tasks and follow-ups are kept off the to-do board,
-- follow-ups page, calendar, dashboard and daily brief, and it's left out
-- of pipeline value and in-progress counts. Everything still shows on the
-- lead's own page.
--
-- Not breaking, purely additive.
--
-- Run once: psql "$DATABASE_URL" -f migrations/054_lead_archive.sql

alter table leads add column archived_at timestamptz;
