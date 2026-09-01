import type Stripe from "stripe";
import { stripe, tierForPriceId, intervalForPriceId, toSubscriptionStatus } from "@/lib/stripe";
import { createBusiness, setStripeCustomerId, updateSubscriptionFromStripe } from "@/lib/data/businesses";
import { lookupAccountEmail } from "@/lib/data/accountEmails";
import { sendWelcomeEmail } from "@/lib/email";

const UNIQUE_VIOLATION = "23505";

interface PendingSignup {
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  passcodeHash: string;
  passcodeSalt: string;
  timezone: string;
}

/**
 * Pulls the pending-signup fields a deferred-creation Checkout Session was
 * created with (see signup/actions.ts) out of its metadata. Returns null for
 * any session that isn't one of those — in particular an existing
 * workspace's restart/switch checkout (settings/actions.ts's
 * startSubscriptionCheckout), whose metadata is just { businessId }.
 */
function readPendingSignup(metadata: Stripe.Metadata | null | undefined): PendingSignup | null {
  if (!metadata) return null;
  const { businessName, ownerName, ownerEmail, passcodeHash, passcodeSalt, timezone } = metadata;
  if (!businessName || !ownerName || !ownerEmail || !passcodeHash || !passcodeSalt || !timezone) return null;
  return { businessName, ownerName, ownerEmail, passcodeHash, passcodeSalt, timezone };
}

/**
 * Provisions the workspace for a completed, deferred-creation Checkout
 * Session — the whole point of signup/actions.ts *not* creating a business
 * row up front is that nothing exists to leave half-abandoned if the
 * customer never finishes paying, so this is the one place that actually
 * creates it, once Stripe confirms the subscription is real.
 *
 * Idempotent and called from two places that can race: the browser's
 * success-page redirect (api/signup/complete/route.ts, the fast path) and
 * the checkout.session.completed webhook (the backup, in case the browser
 * never makes it back — closed tab, network drop, etc.). Whichever lands
 * first wins businesses/account_emails' unique constraint on owner_email
 * and actually creates the row; the other catches that violation and reuses
 * the same business via lookupAccountEmail instead of erroring, and skips
 * the welcome email since it wasn't the one that created the account.
 *
 * Returns the businessId, or null if this session isn't a deferred-signup
 * one at all (readPendingSignup) or its subscription's price doesn't match
 * a known tier/interval — the caller falls back to the plain webhook sync
 * path for the former, and just logs for the latter.
 */
export async function provisionBusinessFromCheckoutSession(
  session: Stripe.Checkout.Session,
  subscription: Stripe.Subscription,
  loginUrl: string
): Promise<string | null> {
  const signup = readPendingSignup(session.metadata);
  if (!signup) return null;

  const priceId = subscription.items.data[0]?.price.id;
  const tier = priceId ? tierForPriceId(priceId) : null;
  const interval = priceId ? intervalForPriceId(priceId) : null;
  if (!tier || !interval) {
    console.error(`provisionBusinessFromCheckoutSession: unrecognized price ${priceId} on subscription ${subscription.id}`);
    return null;
  }

  let businessId: string;
  let created = false;
  try {
    const business = await createBusiness({
      name: signup.businessName,
      ownerName: signup.ownerName,
      ownerEmail: signup.ownerEmail,
      passcodeHash: signup.passcodeHash,
      passcodeSalt: signup.passcodeSalt,
      timezone: signup.timezone,
    });
    businessId = business.id;
    created = true;
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === UNIQUE_VIOLATION) {
      const existing = await lookupAccountEmail(signup.ownerEmail);
      if (!existing) throw e;
      businessId = existing.businessId;
    } else {
      throw e;
    }
  }

  const customerId = typeof session.customer === "string" ? session.customer : null;
  if (customerId) await setStripeCustomerId(businessId, customerId);

  await updateSubscriptionFromStripe(businessId, {
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: toSubscriptionStatus(subscription.status),
    tier,
    billingInterval: interval,
    trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
  });

  // Backfills businessId onto the subscription's own metadata (it couldn't
  // be set at Checkout time — there was no business row yet) so future
  // events for this subscription (renewal, cancellation) resolve it
  // directly via the webhook's normal resolveBusinessId path instead of
  // falling back to the stripe_customer_id lookup.
  if (!subscription.metadata.businessId) {
    try {
      await stripe.subscriptions.update(subscription.id, { metadata: { businessId } });
    } catch (e) {
      console.error("provisionBusinessFromCheckoutSession: failed to backfill businessId metadata:", e);
    }
  }

  if (created) {
    try {
      await sendWelcomeEmail(signup.ownerEmail, signup.ownerName, signup.businessName, loginUrl);
    } catch (e) {
      console.error("Failed to send welcome email:", e);
    }
  }

  return businessId;
}
