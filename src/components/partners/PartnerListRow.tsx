import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";
import { entityColorClass } from "@/lib/avatar";
import { cn } from "@/lib/cn";
import type { PartnerSummary } from "@/lib/data/partners";

export function PartnerListRow({ partner }: { partner: PartnerSummary }) {
  return (
    <Link
      href={`/partners/${partner.id}`}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl bg-white py-4 pl-6 pr-5 shadow-[0_1px_2px_rgba(16,29,51,0.04),0_8px_24px_-16px_rgba(16,29,51,0.15)] transition-colors hover:bg-cream-100/60 sm:flex-row sm:items-center sm:gap-4"
    >
      <span
        className={cn("absolute inset-y-0 left-0 w-1.5", entityColorClass(partner.color, partner.companyName))}
      />
      <div className="flex items-center gap-4">
        <AvatarChip name={partner.companyName} color={partner.color} />
        <div className="min-w-0 flex-1">
          <p className="font-heading text-base font-medium text-navy-900 truncate">{partner.companyName}</p>
          {partner.contactName && <p className="text-sm text-navy-400 truncate">{partner.contactName}</p>}
        </div>
        <ChevronRight size={18} className="shrink-0 text-navy-300 group-hover:text-navy-500 transition-colors sm:hidden" />
      </div>
      <div className="flex items-center justify-between gap-3 sm:ml-auto sm:justify-end sm:gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={partner.active ? "sage" : "slate"}>{partner.active ? "Active" : "Inactive"}</Badge>
          <Badge tone="navy">
            {partner.referralCount} referral{partner.referralCount === 1 ? "" : "s"}
          </Badge>
        </div>
        <div className="flex gap-4">
          <div className="text-right shrink-0">
            <p className="font-heading text-base text-sage-700">{formatCurrency(partner.revenueGenerated)}</p>
            <p className="text-xs text-navy-400">revenue</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-heading text-base text-navy-900">{formatCurrency(partner.amountOwed)}</p>
            <p className="text-xs text-navy-400">owed</p>
          </div>
        </div>
      </div>
      <ChevronRight
        size={18}
        className="hidden shrink-0 text-navy-300 group-hover:text-navy-500 transition-colors sm:block"
      />
    </Link>
  );
}
