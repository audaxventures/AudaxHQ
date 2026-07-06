-- Audax HQ — clients and leads previously only got a color derived by
-- hashing their company name, so the same client could show a different
-- accent color on different screens with no way to control it. Add an
-- explicit, optional color so an operator can pick one that sticks
-- everywhere (avatars, list/grid accent bars, meeting notes).
--
-- Run once: psql "$DATABASE_URL" -f migrations/011_client_lead_color.sql

alter table clients add column color text;
alter table leads add column color text;
