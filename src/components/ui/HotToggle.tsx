"use client";

import { useTransition } from "react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/cn";

/** Flame toggle for flagging a lead/prospect as needing extra focus — persists instantly via the passed server action, no form submit needed. Stops the click from bubbling so it can sit inside a row/card that's itself a link or button. */
export function HotToggle({
  hot,
  onToggle,
  size = 16,
}: {
  hot: boolean;
  onToggle: (hot: boolean) => void | Promise<void>;
  size?: number;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(async () => {
          await onToggle(!hot);
        });
      }}
      onKeyDown={(e) => e.stopPropagation()}
      disabled={pending}
      aria-pressed={hot}
      aria-label={hot ? "Unmark as hot" : "Mark as hot"}
      title={hot ? "Unmark as hot" : "Mark as hot"}
      className={cn(
        "shrink-0 rounded-full p-1 transition-colors cursor-pointer disabled:cursor-wait",
        hot ? "text-burnt-500 hover:text-burnt-600" : "text-navy-200 hover:text-burnt-400"
      )}
    >
      <Flame size={size} fill={hot ? "currentColor" : "none"} />
    </button>
  );
}
