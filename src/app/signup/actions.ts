"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, hashPasscode, SESSION_COOKIE_NAME } from "@/lib/auth";
import { createBusiness, setStripeCustomerId } from "@/lib/data/businesses";
import { createCheckoutSession, createStripeCustomer } from "@/lib/stripe";
import { DEFAULT_TIMEZONE } from "@/lib/timezone";
import type { BillingInterval, BusinessTier } from "@/lib/types";

export interface SignupState {
  error: string | null;
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
  // handler, since that's the first point a trial has actually started
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

  const checkoutUrl = await createCheckoutSession({
    businessId,
    customerId: stripeCustomerId,
    tier,
    interval,
    successUrl: `${origin}/settings/billing?checkout=success`,
    cancelUrl: `${origin}/settings/billing?checkout=canceled`,
  });

  redirect(checkoutUrl);
}
