"use client";

import { useTransition } from "react";
import { updateWorkspaceTier } from "@/app/(app)/admin/actions";
import { TIER_LABELS } from "@/lib/entitlements";
import type { BusinessTier } from "@/lib/types";

const OPTIONS: BusinessTier[] = ["starter", "growth", "scale"];

export function WorkspaceTierSelect({ businessId, tier }: { businessId: string; tier: BusinessTier }) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      value={tier}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as BusinessTier;
        startTransition(() => {
          void updateWorkspaceTier(businessId, next);
        });
      }}
      className="cursor-pointer rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-xs font-medium text-navy-700 disabled:opacity-60"
    >
      {OPTIONS.map((t) => (
        <option key={t} value={t}>
          {TIER_LABELS[t]}
        </option>
      ))}
    </select>
  );
}
