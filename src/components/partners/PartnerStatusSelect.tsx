"use client";

import { useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { TONE_CLASSES } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { PARTNER_STATUS_LABELS, PARTNER_STATUS_ORDER, type PartnerStatus } from "@/lib/types";
import { setPartnerStatus } from "@/app/(app)/partners/actions";

const PARTNER_STATUS_TONE: Record<PartnerStatus, "sage" | "gold" | "slate"> = {
  ACTIVE: "sage",
  POTENTIAL: "gold",
  INACTIVE: "slate",
};

/** A live-saving status dropdown, styled as a colored pill — same "real select overlaid on a styled span" trick as the task/follow-up status pickers, just sized up to match the partner detail page's header. */
export function PartnerStatusSelect({ partnerId, status }: { partnerId: string; status: PartnerStatus }) {
  const [, startTransition] = useTransition();

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center gap-1 rounded-full pl-3 pr-7 py-1.5 text-sm font-medium tracking-wide",
        TONE_CLASSES[PARTNER_STATUS_TONE[status]]
      )}
    >
      <span className="pointer-events-none whitespace-nowrap">{PARTNER_STATUS_LABELS[status]}</span>
      <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 opacity-60" />
      <select
        value={status}
        onChange={(e) =>
          startTransition(async () => {
            await setPartnerStatus(partnerId, e.target.value as PartnerStatus);
          })
        }
        className="absolute inset-0 cursor-pointer appearance-none bg-transparent text-transparent focus:outline-none"
        aria-label="Partner status"
      >
        {PARTNER_STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {PARTNER_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
