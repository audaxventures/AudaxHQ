-- Audax HQ — tracks whether a workspace's owner has dismissed the
-- first-login welcome popup, so it shows exactly once per business
-- rather than being tied to a session/cookie or a time window after
-- signup. Set the moment the owner dismisses the popup (either button)
-- via dismissOnboarding() in src/app/(app)/settings/actions.ts.
--
-- Not breaking, purely additive.
--
-- Run once: psql "$DATABASE_URL" -f migrations/023_business_onboarding.sql

alter table businesses add column onboarding_dismissed_at timestamptz;
