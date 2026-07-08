-- Audax HQ — adds a suspension flag to businesses, backing the platform
-- admin portal's "suspend workspace" action. A suspended business's owner
-- and team can no longer log in (see login() in src/app/login/actions.ts
-- and getCurrentUser() in src/lib/currentUser.ts), but all of its data
-- stays intact — reactivating clears this column and restores access.
--
-- Not breaking, purely additive.
--
-- Run once: psql "$DATABASE_URL" -f migrations/020_business_suspension.sql

alter table businesses add column suspended_at timestamptz;
