import type { EntityColor } from "@/lib/types";

const AVATAR_COLORS = ["bg-navy-700", "bg-sage-600", "bg-slate-600", "bg-blue-600", "bg-burnt-600"];
const AVATAR_CHIP_COLORS = [
  "bg-navy-100 text-navy-700",
  "bg-sage-100 text-sage-600",
  "bg-slate-100 text-slate-600",
  "bg-blue-100 text-blue-600",
  "bg-burnt-100 text-burnt-600",
];

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Deterministic hash-of-name fallback, used when a client/lead hasn't been assigned an explicit color. */
export function avatarColorClass(seed: string): string {
  return AVATAR_COLORS[hashSeed(seed) % AVATAR_COLORS.length];
}

// Literal Tailwind class names (not built from template strings) so the compiler's static analysis can find them.
export const ENTITY_COLOR_BG_CLASS: Record<EntityColor, string> = {
  navy: "bg-navy-700",
  slate: "bg-slate-600",
  blue: "bg-blue-600",
  teal: "bg-teal-600",
  sage: "bg-sage-600",
  burnt: "bg-burnt-600",
  gold: "bg-gold-600",
  brick: "bg-brick-600",
  rose: "bg-rose-600",
  violet: "bg-violet-600",
};

/** The accent/avatar background class for a client or lead: their assigned color if set, otherwise the hash-of-name fallback. */
export function entityColorClass(color: EntityColor | null | undefined, seed: string): string {
  return color ? ENTITY_COLOR_BG_CLASS[color] : avatarColorClass(seed);
}

// Light pill/chip variant of ENTITY_COLOR_BG_CLASS, for name badges (e.g. the
// client/lead chip on a to-do card) rather than solid avatar backgrounds.
export const ENTITY_COLOR_CHIP_CLASS: Record<EntityColor, string> = {
  navy: "bg-navy-100 text-navy-700",
  slate: "bg-slate-100 text-slate-600",
  blue: "bg-blue-100 text-blue-600",
  teal: "bg-teal-100 text-teal-600",
  sage: "bg-sage-100 text-sage-600",
  burnt: "bg-burnt-100 text-burnt-600",
  gold: "bg-gold-100 text-gold-600",
  brick: "bg-brick-100 text-brick-600",
  rose: "bg-rose-100 text-rose-600",
  violet: "bg-violet-100 text-violet-600",
};

/** The chip background+text class for a client or lead's name badge: their assigned color if set, otherwise the hash-of-name fallback. */
export function entityColorChipClass(color: EntityColor | null | undefined, seed: string): string {
  return color ? ENTITY_COLOR_CHIP_CLASS[color] : AVATAR_CHIP_COLORS[hashSeed(seed) % AVATAR_CHIP_COLORS.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
