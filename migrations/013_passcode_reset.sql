-- Audax HQ — "Forgot passcode?" on the login screen emails a time-limited
-- reset link (via Resend). The link's token is stored here as a hash
-- (never the raw token) alongside its expiry, single-row like the rest of
-- app_settings — a new request simply overwrites the previous one.
--
-- Run once: psql "$DATABASE_URL" -f migrations/013_passcode_reset.sql

alter table app_settings add column passcode_reset_token_hash text;
alter table app_settings add column passcode_reset_token_expires_at timestamptz;
