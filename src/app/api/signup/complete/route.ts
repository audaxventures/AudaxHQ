import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { provisionBusinessFromCheckoutSession } from "@/lib/signupFulfillment";

/**
 * success_url for a brand-new (paid) signup's Checkout Session — see
 * signup/actions.ts. Stripe only ever sends the browser here after Checkout
 * actually completes, so this is where the workspace this signup never
 * created up front (on purpose) finally gets provisioned and the owner
 * logged in. checkout.session.completed is a backup for the same
 * provisioning in case the browser never makes it back here.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");
  const origin = url.origin;

  if (!sessionId) {
    return NextResponse.redirect(`${origin}/signup?checkout=invalid`);
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (e) {
    console.error("signup/complete: failed to retrieve checkout session:", e);
    return NextResponse.redirect(`${origin}/signup?checkout=invalid`);
  }

  // status is "complete" only once Checkout has actually finished — never
  // trust query-string presence alone to mean payment succeeded.
  if (session.status !== "complete" || session.mode !== "subscription" || typeof session.subscription !== "string") {
    return NextResponse.redirect(`${origin}/signup?checkout=canceled`);
  }

  let businessId: string | null;
  try {
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    businessId = await provisionBusinessFromCheckoutSession(session, subscription, `${origin}/login`);
  } catch (e) {
    console.error("signup/complete: failed to provision workspace:", e);
    return NextResponse.redirect(`${origin}/signup?checkout=invalid`);
  }

  if (!businessId) {
    // Not a deferred-signup session — shouldn't normally reach this route
    // (only signup/actions.ts's Checkout Sessions point here), but there's
    // nothing to log in as if it happens.
    return NextResponse.redirect(`${origin}/signup?checkout=invalid`);
  }

  const token = createSessionToken({ role: "OWNER", businessId });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return NextResponse.redirect(`${origin}/`);
}
