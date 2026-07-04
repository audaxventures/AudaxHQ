import { cn } from "@/lib/cn";

const CARD_TONES = {
  neutral: "border-navy-100 bg-white/70",
  burnt: "border-burnt-100 bg-gradient-to-b from-white to-burnt-100/40",
  gold: "border-gold-100 bg-gradient-to-b from-white to-gold-100/40",
  sage: "border-sage-100 bg-gradient-to-b from-white to-sage-100/40",
  slate: "border-slate-100 bg-gradient-to-b from-white to-slate-100/40",
} as const;

export function Card({
  children,
  className,
  tone = "neutral",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: keyof typeof CARD_TONES;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border shadow-[0_1px_2px_rgba(16,29,51,0.04),0_8px_24px_-16px_rgba(16,29,51,0.15)]",
        CARD_TONES[tone],
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
