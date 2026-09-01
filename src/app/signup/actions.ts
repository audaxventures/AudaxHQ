"use server";

import { cookies, headers } from "next/headers";
import { createSessionToken, hashPasscode, SESSION_COOKIE_NAME } from "@/lib/auth";
import { createBusiness, setStripeCustomerId, updateSubscriptionFromStripe } from "@/lib/data/businesses";
import { sendWelcomeEmail } from "@/lib/email";
import {
  createCheckoutSession,
  createFreeSubscription,
  createStripeCustomer,
  resolveFreeForeverPromotionCode,
  toSubscriptionStatus,
} from "@/lib/stripe";
import { DEFAULT_TIMEZONE } from "@/lib/timezone";
import type { BillingInterval, BusinessTier } from "@/lib/types";

export interface SignupState {
  error: string | null;
  checkoutUrl?: string;
  redirectUrl?: string;
}

const UNIQUE_VIOLATION = "23505";
const VALID_TIERS: BusinessTier[] = ["starter", "growth", "scale"];
const VALID_INTERVALS: BillingInterval[] = ["monthly", "annual"];

export async function signup(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const businessName = String(formData.get("businessName") ?? "").trim();
  const ownerName = String(formData.get("ownerName") ?? "").trim();
  const ownerEmail = String(formData.get("ownerEmail") ?? "").trim().toLowerCase();
  const passcode = String(formData.get("passcode") ?? "");
  const confirmPasscode = String(formData.get("confirmPasscode") ?? "");
  const timezone = String(formData.get("timezone") ?? "").trim() || DEFAULT_TIMEZONE;
  const tierRaw = String(formData.get("tier") ?? "");
  const intervalRaw = String(formData.get("interval") ?? "");
  const couponCode = String(formData.get("couponCode") ?? "").trim();

  if (!businessName || !ownerName || !ownerEmail) {
    return { error: "Fill in your business name, name, and email." };
  }
  if (passcode.length < 4) {
    return { error: "Password must be at least 4 characters." };
  }
  if (passcode !== confirmPasscode) {
    return { error: "Password and confirmation don't match." };
  }
  if (!VALID_TIERS.includes(tierRaw as BusinessTier) || !VALID_INTERVALS.includes(intervalRaw as BillingInterval)) {
    return { error: "Choose a plan before continuing." };
  }
  const tier = tierRaw as BusinessTier;
  const interval = intervalRaw as BillingInterval;

  const { hash, salt } = hashPasscode(passcode);

  let businessId: string;
  try {
    const business = await createBusiness({
      name: businessName,
      ownerName,
      ownerEmail,
      passcodeHash: hash,
      passcodeSalt: salt,
      timezone,
    });
    businessId = business.id;
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === UNIQUE_VIOLATION) {
      return { error: "That email is already registered. Try signing in instead." };
    }
    throw e;
  }

  // Log them in immediately so /settings/billing (and only that page, per
  // the (app) layout's billing gate) is reachable right away — but the
  // welcome email waits for the webhook's checkout.session.completed
  // handler (or, on the free-coupon path below, gets sent directly), since
  // that's the first point a trial/subscription has actually started
  // rather than a workspace someone created and then abandoned before
  // paying.
  const token = createSessionToken({ role: "OWNER", businessId });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  const host = (await headers()).get("host");
  const protocol = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const stripeCustomerId = await createStripeCustomer(businessId, ownerEmail, businessName);
  await setStripeCustomerId(businessId, stripeCustomerId);

  // A 100%-off-forever promo code is the one case that skips Checkout (and
  // card collection) entirely — the subscription is created directly
  // against the Stripe API instead. Any other code (partial discount,
  // expired, unknown) falls through to the normal Checkout flow below,
  // where allow_promotion_codes lets the customer enter it there instead.
  const promotionCodeId = couponCode ? await resolveFreeForeverPromotionCode(couponCode) : null;
  if (promotionCodeId) {
    const subscription = await createFreeSubscription({
      businessId,
      customerId: stripeCustomerId,
      tier,
      interval,
      promotionCodeId,
    });
    // Sync the business row ourselves instead of waiting on the webhook:
    // this redirects straight back into the (app) layout's billing gate on
    // the very next request, with no Stripe-hosted page in between to buy
    // the webhook's network round trip time to land first (unlike the
    // Checkout flow, where filling out a card form gives it that time).
    // Without this, the gate would see subscriptionStatus still null and
    // block the workspace until the webhook eventually caught up.
    await updateSubscriptionFromStripe(businessId, {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: toSubscriptionStatus(subscription.status),
      tier,
      billingInterval: interval,
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    });
    try {
      await sendWelcomeEmail(ownerEmail, ownerName, businessName, `${origin}/login`);
    } catch (e) {
      console.error("Failed to send welcome email:", e);
    }
    // Not calling redirect() here — see the matching comment below. The
    // client does the actual navigation (see SignupForm.tsx).
    return { error: null, redirectUrl: `${origin}/settings/billing?checkout=success` };
  }

  const checkoutUrl = await createCheckoutSession({
    businessId,
    customerId: stripeCustomerId,
    tier,
    interval,
    successUrl: `${origin}/settings/billing?checkout=success`,
    cancelUrl: `${origin}/settings/billing?checkout=canceled`,
  });

  // Not calling redirect() here — see the matching comment in
  // login/actions.ts. This response also carries the just-set session
  // cookie, so it needs to stay a plain 200 for Safari to persist it; the
  // client does the actual navigation to Stripe (see SignupForm.tsx).
  return { error: null, checkoutUrl };
}
