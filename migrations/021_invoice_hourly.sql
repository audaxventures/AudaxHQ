-- Audax HQ — lets an invoice be billed hourly (hours x rate) instead of only
-- as a flat amount, and adds a short notes field for extra context on what
-- the work was for.
--
-- `amount` stays the source of truth for totals/stats (InvoicesList's stat
-- tiles, aging reports, etc all sum it directly) — for HOURLY invoices it's
-- computed from hours * hourly_rate at write time rather than derived at
-- query time, so existing aggregation queries don't need to change.
--
-- Not breaking, purely additive.
--
-- Run once: psql "$DATABASE_URL" -f migrations/021_invoice_hourly.sql

create type invoice_type as enum ('FIXED', 'HOURLY');

alter table invoices add column invoice_type invoice_type not null default 'FIXED';
alter table invoices add column hours numeric(8, 2);
alter table invoices add column hourly_rate numeric(12, 2);
alter table invoices add column description text;
