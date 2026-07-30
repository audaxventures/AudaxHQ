-- Verclara — adds Stripe subscription billing to businesses. A new signup
-- gets its workspace provisioned immediately (createBusiness) but starts
-- with subscription_status null until Stripe Checkout completes; the
-- webhook handler (src/app/api/webhooks/stripe/route.ts) is the only
-- writer of these columns from that point on — never trust the client.
--
-- Existing (early-access) businesses are backfilled to 'active' with no
-- Stripe customer, so nothing already onboarded gets locked out by this —
-- matches the pricing page's promise that "existing workspaces will get
-- advance notice before anything changes."
--
-- Run once: psql "$DATABASE_URL" -f migrations/042_stripe_billing.sql

alter table businesses add column stripe_customer_id text unique;
alter table businesses add column stripe_subscription_id text unique;
alter table businesses add column subscription_status text
  check (subscription_status in ('trialing', 'active', 'past_due', 'canceled'));
alter table businesses add column trial_ends_at timestamptz;
alter table businesses add column billing_interval text check (billing_interval in ('monthly', 'annual'));

update businesses set subscription_status = 'active' where subscription_status is null;
