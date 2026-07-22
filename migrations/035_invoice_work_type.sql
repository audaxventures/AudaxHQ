-- Lets an invoice carry its own "type of work" independent of the client's
-- current one — a client's work type can change over time or cover more
-- than one kind of work, so attributing historical revenue through the
-- client alone would misreport past invoices. Set once at invoice-creation
-- time (defaulted from the client, see addInvoice in src/lib/actions/...)
-- and never rewritten on edit, so it stays historically accurate.
--
-- Run once: psql "$DATABASE_URL" -f migrations/035_invoice_work_type.sql

alter table invoices add column work_type_id uuid references work_types(id) on delete set null;
alter table invoices add column work_type_other text;
