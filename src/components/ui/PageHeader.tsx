import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { ICON_TONE_CLASSES, type IconTone } from "@/lib/tone";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  icon: Icon,
  tone = "burnt",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: LucideIcon;
  tone?: IconTone;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
      <div className="flex items-start gap-4">
        {Icon && (
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]",
              ICON_TONE_CLASSES[tone]
            )}
          >
            <Icon size={20} />
          </div>
        )}
        <div>
          {eyebrow && (
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-burnt-500 mb-2">
              {eyebrow}
            </p>
          )}
          <h1 className="font-heading text-3xl sm:text-4xl font-medium text-navy-900 leading-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-navy-500 max-w-2xl">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
