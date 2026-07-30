import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, tierForPriceId, intervalForPriceId } from "@/lib/stripe";
import { findBusinessByStripeCustomerId, updateSubscriptionFromStripe } from "@/lib/data/businesses";
import type { SubscriptionStatus } from "@/lib/types";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/** Narrows Stripe's own (wider) status set down to the four we actually store/gate on — see migration 042's check constraint. */
function toSubscriptionStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
  switch (stripeStatus) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
    case "incomplete":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
    case "paused":
      return "canceled";
    default:
      return "canceled";
  }
}

/** businessId always comes off subscription_data.metadata (set at Checkout time in createCheckoutSession) — a stripe_customer_id lookup is only a fallback for subscriptions that somehow lack it. */
async function resolveBusinessId(subscription: Stripe.Subscription): Promise<string | null> {
  const fromMetadata = subscription.metadata.businessId;
  if (fromMetadata) return fromMetadata;
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const business = await findBusinessByStripeCustomerId(customerId);
  return business?.id ?? null;
}

async function syncSubscription(subscription: Stripe.Subscription): Promise<void> {
  const businessId = await resolveBusinessId(subscription);
  if (!businessId) {
    console.error(`Stripe webhook: no business found for subscription ${subscription.id}`);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const tier = priceId ? tierForPriceId(priceId) : null;
  const interval = priceId ? intervalForPriceId(priceId) : null;
  if (!tier || !interval) {
    console.error(`Stripe webhook: unrecognized price ${priceId} on subscription ${subscription.id}`);
    return;
  }

  await updateSubscriptionFromStripe(businessId, {
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: toSubscriptionStatus(subscription.status),
    tier,
    billingInterval: interval,
    trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
  });
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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && typeof session.subscription === "string") {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        await syncSubscription(subscription);
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

  return NextResponse.json({ received: true });
}
