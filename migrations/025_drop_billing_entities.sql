-- Audax HQ — removes the "billing entities" feature. It was meant as a
-- picklist of which of the operator's own companies a client is billed
-- under, but nothing downstream (clients, invoices, exports) was ever
-- wired up to read it — confirmed via a full-codebase search before
-- writing this migration. The Business Info settings tab now shows the
-- workspace's own business name and logo instead.
--
-- Breaking: drops the table and any rows in it. If you'd added entities
-- beyond the two seeded at signup ('Audax Ventures', 'H2MB'), back up
-- `select * from billing_entities` first if you want to keep a record.
--
-- Run once: psql "$DATABASE_URL" -f migrations/025_drop_billing_entities.sql

drop table billing_entities;
