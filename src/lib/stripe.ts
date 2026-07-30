import Stripe from "stripe";
import type { BusinessTier } from "@/lib/types";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set. Add it to your environment (see .env.example).");
}

export const stripe = new Stripe(secretKey);

export type BillingInterval = "monthly" | "annual";

/** Every trial is 7 days, set on the Subscription at Checkout time (see createCheckoutSession) — not configurable per tier or per customer. */
export const TRIAL_PERIOD_DAYS = 7;

const PRICE_ENV_VARS: Record<BusinessTier, Record<BillingInterval, string | undefined>> = {
  starter: { monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY, annual: process.env.STRIPE_PRICE_STARTER_ANNUAL },
  growth: { monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY, annual: process.env.STRIPE_PRICE_GROWTH_ANNUAL },
  scale: { monthly: process.env.STRIPE_PRICE_SCALE_MONTHLY, annual: process.env.STRIPE_PRICE_SCALE_ANNUAL },
};

/** The Stripe Price id for a tier + billing interval — throws loudly rather than silently checking out against the wrong plan if an env var is missing. */
export function priceIdFor(tier: BusinessTier, interval: BillingInterval): string {
  const id = PRICE_ENV_VARS[tier][interval];
  if (!id) {
    throw new Error(`STRIPE_PRICE_${tier.toUpperCase()}_${interval.toUpperCase()} is not set.`);
  }
  return id;
}

/**
 * Creates the Stripe Customer for a brand-new workspace right after
 * createBusiness() — done eagerly (rather than letting Checkout create one
 * implicitly) so businesses.stripe_customer_id is populated even if the
 * owner abandons Checkout, and the billing page has something to work
 * with on retry.
 */
export async function createStripeCustomer(businessId: string, email: string, name: string): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { businessId },
  });
  return customer.id;
}

/**
 * A Checkout Session for a new (or retried) subscription — trial starts
 * immediately, card is collected upfront (converts better than a
 * card-free trial and avoids a second "come back and pay" flow), and
 * promo codes are enabled so the discount-code field shows up for free.
 * The webhook (checkout.session.completed / customer.subscription.updated)
 * is what actually syncs tier/subscription_status onto the business row —
 * this only ever redirects the browser to Stripe's hosted page.
 */
export async function createCheckoutSession(input: {
  businessId: string;
  customerId: string;
  tier: BusinessTier;
  interval: BillingInterval;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: input.customerId,
    line_items: [{ price: priceIdFor(input.tier, input.interval), quantity: 1 }],
    subscription_data: {
      trial_period_days: TRIAL_PERIOD_DAYS,
      metadata: { businessId: input.businessId },
    },
    allow_promotion_codes: true,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: { businessId: input.businessId },
  });
  if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
  return session.url;
}

/** Stripe's hosted self-serve page for upgrading/downgrading tier, switching monthly/annual, updating a card, or canceling — used by the "Manage billing" button on Settings > Billing. */
export async function createPortalSession(customerId: string, returnUrl: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

/** Reverse-lookup from a Stripe Price id back to which tier it belongs to — used by the webhook handler, which only gets Price ids off the Subscription object, not the tier name. */
export function tierForPriceId(priceId: string): BusinessTier | null {
  for (const tier of Object.keys(PRICE_ENV_VARS) as BusinessTier[]) {
    if (PRICE_ENV_VARS[tier].monthly === priceId || PRICE_ENV_VARS[tier].annual === priceId) return tier;
  }
  return null;
}

/** Same reverse-lookup, for billing interval. */
export function intervalForPriceId(priceId: string): BillingInterval | null {
  for (const tier of Object.keys(PRICE_ENV_VARS) as BusinessTier[]) {
    if (PRICE_ENV_VARS[tier].monthly === priceId) return "monthly";
    if (PRICE_ENV_VARS[tier].annual === priceId) return "annual";
  }
  return null;
}
