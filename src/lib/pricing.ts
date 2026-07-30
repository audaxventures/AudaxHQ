import type { BillingInterval, BusinessTier } from "@/lib/types";

/**
 * Single source of truth for the 3 subscription tiers — read by both the
 * marketing pricing page (src/app/site/pricing/page.tsx) and the signup
 * plan picker (src/components/SignupForm.tsx), so the two can never drift.
 * Dollar amounts here must match the Stripe Prices configured via the
 * STRIPE_PRICE_* env vars (see src/lib/stripe.ts) — this file has no
 * connection to Stripe itself, it's just display copy.
 */
export interface PricingTierInfo {
  tier: BusinessTier;
  name: string;
  audience: string;
  highlight: boolean;
  monthly: number;
  annualMonthly: number;
  annualTotal: number;
  features: string[];
}

export const PRICING_TIERS: PricingTierInfo[] = [
  {
    tier: "starter",
    name: "Starter",
    audience: "For solo operators & small teams",
    highlight: false,
    monthly: 30,
    annualMonthly: 25,
    annualTotal: 300,
    features: [
      "Up to 2 team members",
      "Unlimited clients & leads",
      "Pipeline & revenue tracking",
      "Meeting notes, time tracking & tasks",
      "Data export, anytime",
    ],
  },
  {
    tier: "growth",
    name: "Growth",
    audience: "For small teams",
    highlight: true,
    monthly: 50,
    annualMonthly: 42,
    annualTotal: 500,
    features: [
      "Everything in Starter",
      "Up to 5 team members",
      "Per-client access control",
      "Assign and hand off tasks across your team",
    ],
  },
  {
    tier: "scale",
    name: "Scale",
    audience: "For growing teams",
    highlight: false,
    monthly: 80,
    annualMonthly: 67,
    annualTotal: 800,
    features: ["Everything in Growth", "Unlimited team members", "Priority support", "Early access to new features"],
  },
];

export function priceForInterval(info: PricingTierInfo, interval: BillingInterval): number {
  return interval === "annual" ? info.annualMonthly : info.monthly;
}
