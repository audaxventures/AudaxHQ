import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";
import { TONE_TEXT_CLASSES, type IconTone } from "@/lib/tone";

/**
 * The self-contained "panel" every record-detail tab is built from — a
 * tone-tinted card with an eyebrow/title/description header and a quiet
 * corner dot-grid accent, the one recurring motif tying the redesigned
 * tabs together. Two of these side by side (via a `grid lg:grid-cols-2`
 * wrapper at the call site) is the paired-columns layout; a single one
 * full-width is the treatment for tabs with no natural pair.
 */
export function SectionPanel({
  eyebrow,
  title,
  description,
  tone,
  action,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  tone: IconTone;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card tone={tone} className={cn("relative overflow-hidden p-5 sm:p-6", className)}>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-3 -top-3 h-24 w-24 opacity-20 [background-image:radial-gradient(currentColor_1.5px,transparent_1.5px)] [background-size:11px_11px] [mask-image:radial-gradient(circle_at_top_right,black,transparent_70%)]",
          TONE_TEXT_CLASSES[tone]
        )}
      />
      <div className="relative mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <p className={cn("text-[11px] font-semibold uppercase tracking-wider", TONE_TEXT_CLASSES[tone])}>{eyebrow}</p>
          <h3 className="mt-1 font-heading text-xl font-bold text-navy-900">{title}</h3>
          {description && <p className="mt-1 text-sm text-navy-500">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="relative">{children}</div>
    </Card>
  );
}
