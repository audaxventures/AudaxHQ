import type { BusinessTier } from "@/lib/types";

/** Higher rank = more capable tier — lets hasFeature() do a single numeric comparison instead of hardcoding tier combinations per feature. */
const TIER_RANK: Record<BusinessTier, number> = {
  starter: 0,
  growth: 1,
  scale: 2,
};

export const TIER_LABELS: Record<BusinessTier, string> = {
  starter: "Starter",
  growth: "Growth",
  scale: "Scale",
};

/**
 * The feature keys this layer can gate, and the minimum tier each requires.
 * Empty today — nothing in the product is actually tier-gated yet, since
 * early access is free and every business defaults to 'scale' (see
 * migration 031). This exists so the next tier-gated feature (e.g. Stripe
 * payment collection on invoices) has a switch to flip rather than a new
 * mechanism to build.
 */
const FEATURE_MIN_TIER = {} as const satisfies Record<string, BusinessTier>;

export type FeatureKey = keyof typeof FEATURE_MIN_TIER;

/** True if `tier` meets the minimum tier required for `feature`. */
export function hasFeature(tier: BusinessTier, feature: FeatureKey): boolean {
  return TIER_RANK[tier] >= TIER_RANK[FEATURE_MIN_TIER[feature]];
}
