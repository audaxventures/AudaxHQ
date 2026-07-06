"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { ENTITY_COLOR_BG_CLASS } from "@/lib/avatar";
import { ENTITY_COLOR_ORDER, ENTITY_COLOR_LABELS } from "@/lib/types";
import type { EntityColor } from "@/lib/types";

/** Instant-save color swatch trigger for a client/lead detail page header — persists on click via the passed server action, no form submit needed. */
export function EntityColorPicker({
  color,
  onSelect,
}: {
  color: EntityColor | null;
  onSelect: (color: EntityColor | null) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const choose = (next: EntityColor | null) => {
    setOpen(false);
    startTransition(async () => {
      await onSelect(next);
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Choose color"
        className={cn(
          "h-6 w-6 rounded-full border border-navy-200/70 transition-transform hover:scale-105 cursor-pointer",
          color ? ENTITY_COLOR_BG_CLASS[color] : "border-dashed bg-cream-100"
        )}
      />
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-2 flex w-[184px] flex-wrap gap-2 rounded-xl border border-navy-100 bg-white p-3 shadow-lg">
            <button
              type="button"
              onClick={() => choose(null)}
              aria-label="Automatic"
              aria-pressed={color === null}
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-navy-300 bg-cream-100 cursor-pointer"
            >
              {color === null && <Check size={13} className="text-navy-500" />}
            </button>
            {ENTITY_COLOR_ORDER.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => choose(c)}
                aria-label={ENTITY_COLOR_LABELS[c]}
                aria-pressed={color === c}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full cursor-pointer",
                  ENTITY_COLOR_BG_CLASS[c]
                )}
              >
                {color === c && <Check size={13} className="text-cream-50" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
