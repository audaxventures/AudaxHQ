import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/cn";

const CALENDLY_URL = "https://calendly.com/audax-ventures/verclara";

type Variant = "primary" | "on-dark" | "on-light";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-burnt-500 text-cream-50 shadow-sm hover:bg-burnt-400",
  "on-dark": "border border-navy-600 text-cream-100 hover:border-navy-400 hover:bg-navy-800",
  "on-light": "border border-navy-300 text-navy-800 hover:border-navy-400 hover:bg-white",
};

/**
 * Links out to the team's Calendly booking page — deliberately a `CalendarClock`
 * icon rather than the `ArrowRight` every other marketing CTA uses, so it reads
 * as "opens a scheduler" rather than "navigates further into the site".
 */
export function BookDemoButton({ variant = "on-dark", className }: { variant?: Variant; className?: string }) {
  return (
    <a
      href={CALENDLY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      Book a free demo <CalendarClock size={16} />
    </a>
  );
}
