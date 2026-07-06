import { Bell, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type StatCardTone = "sage" | "burnt" | "violet";

const BG_CLASSES: Record<StatCardTone, string> = {
  sage: "bg-sage-100",
  burnt: "bg-burnt-100",
  violet: "bg-violet-100",
};

const ICON_RING_CLASSES: Record<StatCardTone, string> = {
  sage: "border-sage-600 text-sage-600",
  burnt: "border-burnt-500 text-burnt-500",
  violet: "border-violet-600 text-violet-600",
};

export function StatCard({
  tone,
  icon: Icon,
  label,
  value,
  caption,
  decoration,
}: {
  tone: StatCardTone;
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  caption: React.ReactNode;
  /** Low-opacity decorative art filling the card background — purely visual, so it's hidden from assistive tech by its own markup. */
  decoration?: React.ReactNode;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl p-6", BG_CLASSES[tone])}>
      {decoration}
      <div
        className={cn(
          "relative flex h-14 w-14 items-center justify-center rounded-full border-2 bg-white",
          ICON_RING_CLASSES[tone]
        )}
      >
        <Icon size={22} />
      </div>
      <p className="relative mt-4 text-xs font-semibold uppercase tracking-wide text-navy-600">{label}</p>
      <p className="relative font-heading text-4xl font-semibold text-navy-900 tabular-nums leading-tight">
        {value}
      </p>
      <div className="relative mt-1.5 text-sm font-medium">{caption}</div>
    </div>
  );
}

/** Purely decorative background art for the 3 dashboard stat cards — each `aria-hidden` and clipped by the card's `overflow-hidden`. */
export function RevenueDecoration() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 300 90"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full text-sage-600/15"
    >
      <path d="M0,70 L40,55 L70,62 L110,35 L150,48 L190,20 L230,38 L300,10 L300,90 L0,90 Z" fill="currentColor" />
    </svg>
  );
}

export function ChecklistDecoration() {
  return (
    <div aria-hidden className="pointer-events-none absolute right-5 top-5 space-y-2 opacity-20">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-[3px] border-2 border-burnt-500" />
          <span className="h-1 w-14 rounded-full bg-burnt-500" />
        </div>
      ))}
    </div>
  );
}

export function BellDecoration() {
  return (
    <Bell
      aria-hidden
      strokeWidth={1.5}
      className="pointer-events-none absolute -right-3 -bottom-3 h-28 w-28 text-violet-600/15"
    />
  );
}
