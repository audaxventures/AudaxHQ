-- Verclara — reworks the Hour & Cost Tracker's billing model. Previously a
-- single time_entries.rate column was overloaded to mean both "labor cost"
-- and "billing rate" for the same entry, and the two call sites that
-- derived cost/revenue/profit from it (tracker/page.tsx and
-- buildCostSummary in src/lib/data/costEntries.ts) disagreed about which
-- was which — the direct cause of a logged entry showing identical
-- cost/revenue/profit figures. This migration and its accompanying app
-- changes settle on one meaning: cost always comes from
-- team_members.default_hourly_rate (what the hour actually costs the
-- business), revenue always comes from what's actually invoiced, and
-- time_entries.rate becomes an optional per-entry billing rate used only
-- when generating an invoice from unbilled hours.
--
-- 1. time_entries.rate is no longer required — hours + who + date is
--    enough to log a time entry; a $ rate is only needed for entries that
--    will actually be billed.
-- 2. clients.hourly_rate is a new, separate field from the existing
--    clients.rate column (which is a monthly-fee/reference-total figure
--    for RECURRING/PROJECT clients, not a per-hour rate) — the rate to
--    default onto an hourly invoice for this client.
-- 3. time_entries.invoice_id links a billable entry to the invoice it was
--    billed on, once billed — the "unbilled hours" view is just entries
--    with billable = true and invoice_id is null. Deleting the invoice
--    un-bills the hours (ON DELETE SET NULL) rather than orphaning them.
--
-- Not breaking, purely additive/loosening — existing rows are untouched.
--
-- Run once: psql "$DATABASE_URL" -f migrations/044_tracker_billing_rework.sql

alter table time_entries alter column rate drop not null;
alter table time_entries alter column rate drop default;

alter table clients add column hourly_rate numeric(10,2);

alter table time_entries add column invoice_id uuid references invoices(id) on delete set null;
create index time_entries_invoice_id_idx on time_entries (invoice_id);
create index time_entries_unbilled_idx on time_entries (business_id, client_id) where billable and invoice_id is null;
