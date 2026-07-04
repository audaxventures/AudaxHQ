export type Tone = "neutral" | "burnt" | "gold" | "sage" | "slate" | "navy";

export const CARD_TONE_CLASSES: Record<Tone, string> = {
  neutral: "border-navy-100 bg-white/70",
  burnt: "border-burnt-100 bg-gradient-to-b from-white to-burnt-100/40",
  gold: "border-gold-100 bg-gradient-to-b from-white to-gold-100/40",
  sage: "border-sage-100 bg-gradient-to-b from-white to-sage-100/40",
  slate: "border-slate-100 bg-gradient-to-b from-white to-slate-100/40",
  navy: "border-navy-100 bg-gradient-to-b from-white to-navy-100/40",
};

export type IconTone = Exclude<Tone, "neutral">;

export const ICON_TONE_CLASSES: Record<IconTone, string> = {
  burnt: "bg-burnt-100 text-burnt-600",
  gold: "bg-gold-100 text-gold-600",
  sage: "bg-sage-100 text-sage-600",
  slate: "bg-slate-100 text-slate-600",
  navy: "bg-navy-100 text-navy-700",
};
