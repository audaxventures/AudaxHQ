import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

const ICON_TONES = {
  burnt: "bg-burnt-100 text-burnt-600",
  gold: "bg-gold-100 text-gold-600",
  sage: "bg-sage-100 text-sage-600",
  slate: "bg-slate-100 text-slate-600",
} as const;

export function PanelHeading({
  icon: Icon,
  tone,
  title,
  action,
}: {
  icon: LucideIcon;
  tone: keyof typeof ICON_TONES;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px]",
            ICON_TONES[tone]
          )}
        >
          <Icon size={14} />
        </div>
        <h3 className="font-heading text-base font-medium text-navy-900">{title}</h3>
      </div>
      {action}
    </div>
  );
}
