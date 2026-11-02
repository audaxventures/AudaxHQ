/**
 * Colour identity for the Notes page — each sidebar view has its own
 * colour, and folders/tags get a stable colour from their name. Literal
 * class strings so Tailwind's compiler can find them.
 */

export type NoteHue = "navy" | "teal" | "burnt" | "sage" | "violet" | "gold" | "blue" | "rose";

export interface HueClasses {
  /** Coloured icon/text. */
  text: string;
  /** Light wash background. */
  soft: string;
  /** Soft chip: background + text. */
  chip: string;
  /** Small solid dot / accent bar. */
  solid: string;
}

export const HUES: Record<NoteHue, HueClasses> = {
  navy: { text: "text-navy-700", soft: "bg-navy-100", chip: "bg-navy-100 text-navy-700", solid: "bg-navy-700" },
  teal: { text: "text-teal-600", soft: "bg-teal-100", chip: "bg-teal-100 text-teal-600", solid: "bg-teal-600" },
  burnt: { text: "text-burnt-600", soft: "bg-burnt-100", chip: "bg-burnt-100 text-burnt-600", solid: "bg-burnt-500" },
  sage: { text: "text-sage-600", soft: "bg-sage-100", chip: "bg-sage-100 text-sage-600", solid: "bg-sage-600" },
  violet: { text: "text-violet-600", soft: "bg-violet-100", chip: "bg-violet-100 text-violet-600", solid: "bg-violet-600" },
  gold: { text: "text-gold-600", soft: "bg-gold-100", chip: "bg-gold-100 text-gold-600", solid: "bg-gold-600" },
  blue: { text: "text-blue-600", soft: "bg-blue-100", chip: "bg-blue-100 text-blue-600", solid: "bg-blue-600" },
  rose: { text: "text-rose-600", soft: "bg-rose-100", chip: "bg-rose-100 text-rose-600", solid: "bg-rose-600" },
};

/** Matches the client/lead/partner badge tones used elsewhere in the app (sage / violet / gold). */
export const VIEW_HUES = {
  all: "navy",
  private: "teal",
  unfiled: "burnt",
  clients: "sage",
  leads: "violet",
  partners: "gold",
} as const satisfies Record<string, NoteHue>;

// Teal is kept for private notes only, so a folder or tag never looks like the Private badge.
const NAME_HUES: NoteHue[] = ["blue", "rose", "burnt", "gold", "sage", "violet"];

/** A stable colour for a folder or tag, picked from its name. */
export function hueFor(name: string): HueClasses {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return HUES[NAME_HUES[hash % NAME_HUES.length]];
}
