import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, tierForPriceId, intervalForPriceId, toSubscriptionStatus } from "@/lib/stripe";
import { findBusinessByStripeCustomerId, getBusiness, updateSubscriptionFromStripe } from "@/lib/data/businesses";
import { provisionBusinessFromCheckoutSession } from "@/lib/signupFulfillment";
import { sendWelcomeEmail } from "@/lib/email";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/** businessId always comes off subscription_data.metadata (set at Checkout time in createCheckoutSession) — a stripe_customer_id lookup is only a fallback for subscriptions that somehow lack it. */
async function resolveBusinessId(subscription: Stripe.Subscription): Promise<string | null> {
  const fromMetadata = subscription.metadata.businessId;
  if (fromMetadata) return fromMetadata;
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const business = await findBusinessByStripeCustomerId(customerId);
  return business?.id ?? null;
}

/** Returns the businessId it synced, or null if it bailed out early (no matching business, unrecognized price) — callers that need to react to a successful sync (e.g. the welcome email) key off that return value instead of duplicating the resolve/validate logic. */
async function syncSubscription(subscription: Stripe.Subscription): Promise<string | null> {
  const businessId = await resolveBusinessId(subscription);
  if (!businessId) {
    console.error(`Stripe webhook: no business found for subscription ${subscription.id}`);
    return null;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const tier = priceId ? tierForPriceId(priceId) : null;
  const interval = priceId ? intervalForPriceId(priceId) : null;
  if (!tier || !interval) {
    console.error(`Stripe webhook: unrecognized price ${priceId} on subscription ${subscription.id}`);
    return null;
  }

  await updateSubscriptionFromStripe(businessId, {
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: toSubscriptionStatus(subscription.status),
    tier,
    billingInterval: interval,
    trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
  });
  return businessId;
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set — rejecting webhook.");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Signature verification needs the exact raw bytes Stripe signed — never
  // parse this as JSON first, since re-serializing could change whitespace
  // and invalidate the signature.
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (e) {
    console.error("Stripe webhook signature verification failed:", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Always acknowledge with 200 once the signature checks out, even if
  // something below throws (a Stripe API hiccup, a synthetic test event
  // referencing an id that doesn't really exist, an unrecognized price).
  // Returning a non-2xx here makes Stripe retry the same event for up to 3
  // days — appropriate for a transient failure, but not for a bug, which a
  // retry storm won't fix. Log and move on; the next real event for this
  // subscription (there's always another one along soon — created, then
  // updated on renewal, etc.) will reconcile state either way.
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          const host = request.headers.get("host");
          const protocol = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";
          const loginUrl = `${protocol}://${host}/login`;

          // A brand-new signup (signup/actions.ts) never created a business
          // row up front — this is the backup path that provisions one from
          // the session's pending-signup metadata in case the browser never
          // made it back to api/signup/complete (closed tab, network drop).
          // Returns null for every other kind of session (e.g. an existing
          // workspace's startSubscriptionCheckout), which falls through to
          // the plain sync path below exactly as before.
          const provisionedBusinessId = await provisionBusinessFromCheckoutSession(session, subscription, loginUrl);
          if (provisionedBusinessId) break;

          const businessId = await syncSubscription(subscription);
          // Fires exactly here, not at signup — this is the first point a
          // trial has actually started (card confirmed, Checkout completed),
          // not just a workspace someone created and then abandoned before
          // paying. Best-effort: a failed email should never fail the
          // webhook, which is what actually unlocks the workspace.
          if (businessId) {
            try {
              const business = await getBusiness(businessId);
              await sendWelcomeEmail(business.ownerEmail, business.ownerName, business.name, loginUrl);
            } catch (e) {
              console.error("Failed to send welcome email:", e);
            }
          }
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscription(subscription);
        break;
      }
      case "invoice.payment_failed": {
        // Stripe already flips the Subscription's own status to past_due (or
        // unpaid, after its retry schedule is exhausted) and fires
        // customer.subscription.updated for that — which is what actually
        // syncs our subscription_status. Nothing else to do here yet; this
        // case exists as a hook for a future "your payment failed" email.
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error(`Stripe webhook: error handling ${event.type} (${event.id}):`, e);
  }

  return NextResponse.json({ received: true });
}
