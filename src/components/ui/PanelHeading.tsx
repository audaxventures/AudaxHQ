import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { ICON_TONE_CLASSES, type IconTone } from "@/lib/tone";

export function PanelHeading({
  icon: Icon,
  tone,
  title,
  action,
}: {
  icon: LucideIcon;
  tone: IconTone;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px]",
            ICON_TONE_CLASSES[tone]
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
