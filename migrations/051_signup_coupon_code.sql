-- Tracks which businesses signed up using a 100%-off-forever promo code
-- (src/lib/stripe.ts's resolveFreeForeverPromotionCode) — set once, right
-- after signup/actions.ts's free-coupon path provisions the workspace.
--
-- A complimentary account like this lands on subscription_status='active'
-- with a real stripe_customer_id, exactly like a real paying customer —
-- there was previously no way to tell them apart anywhere in the admin
-- dashboard, and getPlatformStats' MRR figure was counting them as full
-- price. MRR now excludes any workspace with this column set.
--
-- Run once: psql "$DATABASE_URL" -f migrations/051_signup_coupon_code.sql

alter table businesses add column signup_coupon_code text;
