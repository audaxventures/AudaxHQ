"use server";

import { cookies, headers } from "next/headers";
import { createSessionToken, hashPasscode, SESSION_COOKIE_NAME } from "@/lib/auth";
import { createBusiness, setSignupCouponCode, setStripeCustomerId, updateSubscriptionFromStripe } from "@/lib/data/businesses";
import { lookupAccountEmail } from "@/lib/data/accountEmails";
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
  // Bounded well under Stripe's 500-char metadata value limit — the paid
  // path below carries these fields as Checkout Session metadata until
  // Checkout completes, so an oversized value would otherwise fail there
  // with an opaque Stripe API error instead of a clear message here.
  if (businessName.length > 200 || ownerName.length > 200) {
    return { error: "Business name and your name must be under 200 characters." };
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

  // Checked up front, before anything else (including any Stripe call) —
  // the paid path below no longer creates a business row of its own to
  // catch a unique-constraint violation from, so this is the only
  // duplicate-email check a brand-new paid signup gets. (The free-coupon
  // path still creates its business row here in this action, so it also
  // keeps its own catch below as a defense-in-depth backstop.)
  if (await lookupAccountEmail(ownerEmail)) {
    return { error: "That email is already registered. Try signing in instead." };
  }

  const { hash, salt } = hashPasscode(passcode);

  const host = (await headers()).get("host");
  const protocol = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  // A 100%-off-forever promo code is the one case that provisions the
  // workspace immediately, right here, and skips Stripe Checkout (and card
  // collection) entirely. Every other signup — see the paid branch below —
  // provisions nothing at all until Checkout actually completes.
  const freeCoupon = couponCode ? await resolveFreeForeverPromotionCode(couponCode) : null;
  if (freeCoupon) {
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

    // Best-effort: this is what tells the admin dashboard a complimentary
    // account apart from a real paying customer (see setSignupCouponCode's
    // comment) — worth logging loudly if it fails, but never worth failing
    // the signup itself over.
    try {
      await setSignupCouponCode(businessId, freeCoupon.code);
    } catch (e) {
      console.error("Failed to record signup coupon code:", e);
    }

    const stripeCustomerId = await createStripeCustomer(businessId, ownerEmail, businessName);
    await setStripeCustomerId(businessId, stripeCustomerId);

    const subscription = await createFreeSubscription({
      businessId,
      customerId: stripeCustomerId,
      tier,
      interval,
      promotionCodeId: freeCoupon.id,
    });
    // Sync the business row ourselves instead of waiting on the webhook:
    // this redirects straight back into the (app) layout's billing gate on
    // the very next request, with no Stripe-hosted page in between to buy
    // the webhook's network round trip time to land first (unlike the paid
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

    // Only the free-coupon path logs in here — the paid path below hasn't
    // created anything yet to log in as (see its comment).
    const token = createSessionToken({ role: "OWNER", businessId });
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    // Not calling redirect() here — see the matching comment below. The
    // client does the actual navigation (see SignupForm.tsx).
    return { error: null, redirectUrl: `${origin}/settings/billing?checkout=success` };
  }

  // No qualifying coupon: nothing is created here at all — no business row,
  // no account_emails entry, no Stripe customer, no session cookie. A
  // workspace this far along used to get created up front and only gated
  // behind billing afterward, which meant abandoning Checkout (or just
  // hitting back) left a real, logged-in account sitting around with no
  // subscription — visible in the admin panel, and stuck looking at
  // Settings > Billing forever. Instead, the signup form's data travels to
  // Stripe as Checkout Session metadata, and only turns into an actual
  // workspace once Checkout completes: api/signup/complete/route.ts (the
  // success_url below) does the provisioning and logs the owner in, with
  // the checkout.session.completed webhook as a backup in case the browser
  // never makes it back there — see provisionBusinessFromCheckoutSession.
  // Abandon Checkout or hit back, and there was never anything to abandon.
  const checkoutUrl = await createCheckoutSession({
    tier,
    interval,
    customerEmail: ownerEmail,
    successUrl: `${origin}/api/signup/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}/signup?checkout=canceled`,
    metadata: {
      businessName,
      ownerName,
      ownerEmail,
      passcodeHash: hash,
      passcodeSalt: salt,
      timezone,
    },
  });

  // Not calling redirect() here — see the matching comment in
  // login/actions.ts. The client does the actual navigation to Stripe (see
  // SignupForm.tsx).
  return { error: null, checkoutUrl };
}
