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

/** The feature keys this layer can gate, and the minimum tier each requires — see src/lib/pricing.ts's per-tier feature lists, which this must stay in sync with. */
const FEATURE_MIN_TIER = {
  perClientAccessControl: "growth",
} as const satisfies Record<string, BusinessTier>;

export type FeatureKey = keyof typeof FEATURE_MIN_TIER;

/** True if `tier` meets the minimum tier required for `feature`. */
export function hasFeature(tier: BusinessTier, feature: FeatureKey): boolean {
  return TIER_RANK[tier] >= TIER_RANK[FEATURE_MIN_TIER[feature]];
}

/** Team member seat cap per tier (excludes the owner's own synthetic team_members row — see ensureOwnerTeamMember). Null = unlimited. Must stay in sync with src/lib/pricing.ts's "Up to N team members" / "Unlimited team members" copy. */
export const TEAM_MEMBER_SEAT_CAP: Record<BusinessTier, number | null> = {
  starter: 2,
  growth: 5,
  scale: null,
};
