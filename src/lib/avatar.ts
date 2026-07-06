import type { EntityColor } from "@/lib/types";

const AVATAR_COLORS = ["bg-navy-700", "bg-sage-600", "bg-slate-600", "bg-blue-600", "bg-burnt-600"];

/** Deterministic hash-of-name fallback, used when a client/lead hasn't been assigned an explicit color. */
export function avatarColorClass(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// Literal Tailwind class names (not built from template strings) so the compiler's static analysis can find them.
export const ENTITY_COLOR_BG_CLASS: Record<EntityColor, string> = {
  navy: "bg-navy-700",
  slate: "bg-slate-600",
  blue: "bg-blue-600",
  sage: "bg-sage-600",
  burnt: "bg-burnt-600",
  gold: "bg-gold-600",
  brick: "bg-brick-600",
  violet: "bg-violet-600",
};

/** The accent/avatar background class for a client or lead: their assigned color if set, otherwise the hash-of-name fallback. */
export function entityColorClass(color: EntityColor | null | undefined, seed: string): string {
  return color ? ENTITY_COLOR_BG_CLASS[color] : avatarColorClass(seed);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
