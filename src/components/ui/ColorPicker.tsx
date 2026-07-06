"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { ENTITY_COLOR_BG_CLASS } from "@/lib/avatar";
import { ENTITY_COLOR_ORDER, ENTITY_COLOR_LABELS } from "@/lib/types";
import type { EntityColor } from "@/lib/types";

/** Swatch picker embedded in a form — stores the pick in a hidden input submitted with the rest of the form. */
export function ColorPicker({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: EntityColor | null;
}) {
  const [selected, setSelected] = useState<EntityColor | null>(defaultValue ?? null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input type="hidden" name={name} value={selected ?? ""} />
      <button
        type="button"
        onClick={() => setSelected(null)}
        aria-label="Automatic"
        aria-pressed={selected === null}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-navy-300 bg-cream-100 cursor-pointer transition-shadow",
          selected === null && "ring-2 ring-navy-900 ring-offset-2 ring-offset-cream-50"
        )}
      />
      {ENTITY_COLOR_ORDER.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => setSelected(c)}
          aria-label={ENTITY_COLOR_LABELS[c]}
          aria-pressed={selected === c}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full cursor-pointer transition-shadow",
            ENTITY_COLOR_BG_CLASS[c],
            selected === c && "ring-2 ring-navy-900 ring-offset-2 ring-offset-cream-50"
          )}
        >
          {selected === c && <Check size={13} className="text-cream-50" />}
        </button>
      ))}
    </div>
  );
}
