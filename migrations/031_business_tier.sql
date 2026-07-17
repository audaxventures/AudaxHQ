-- Adds a subscription tier to businesses, backing the entitlement layer
-- (see src/lib/entitlements.ts). Purely additive — no feature is actually
-- gated by this yet. Defaults every business (existing and new) to 'scale',
-- the top tier, since there's no billing integration yet and early-access
-- workspaces shouldn't be under-provisioned ahead of one existing. Once
-- real billing exists, new signups can default to 'starter' instead and
-- this column becomes the thing Stripe webhooks update.
--
-- Run once: psql "$DATABASE_URL" -f migrations/031_business_tier.sql

alter table businesses add column tier text not null default 'scale' check (tier in ('starter', 'growth', 'scale'));
