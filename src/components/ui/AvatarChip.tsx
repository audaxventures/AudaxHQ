import { entityColorClass, initials } from "@/lib/avatar";
import { cn } from "@/lib/cn";
import type { EntityColor } from "@/lib/types";

export function AvatarChip({
  name,
  color,
  className,
}: {
  name: string;
  color?: EntityColor | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] font-heading text-xs font-semibold text-cream-50",
        entityColorClass(color, name),
        className
      )}
    >
      {initials(name)}
    </div>
  );
}
