import { cn } from "@/lib/cn";
import { CARD_TONE_CLASSES, type Tone } from "@/lib/tone";

export function Card({
  children,
  className,
  tone = "neutral",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: Tone;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border shadow-[0_1px_2px_rgba(16,29,51,0.04),0_8px_24px_-16px_rgba(16,29,51,0.15)]",
        CARD_TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-1">
      <div>
        <h3 className="font-heading text-lg font-medium text-navy-900">{title}</h3>
        {description && (
          <p className="mt-0.5 text-sm text-navy-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
