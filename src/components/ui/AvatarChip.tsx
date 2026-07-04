import { avatarColorClass, initials } from "@/lib/avatar";
import { cn } from "@/lib/cn";

export function AvatarChip({ name, className }: { name: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] font-heading text-xs font-semibold text-cream-50",
        avatarColorClass(name),
        className
      )}
    >
      {initials(name)}
    </div>
  );
}
