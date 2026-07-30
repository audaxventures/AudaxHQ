import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";
import { entityColorClass } from "@/lib/avatar";
import { cn } from "@/lib/cn";
import type { PartnerSummary } from "@/lib/data/partners";

export function PartnerGridCard({ partner }: { partner: PartnerSummary }) {
  return (
    <Link
      href={`/partners/${partner.id}`}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl bg-white py-5 pl-6 pr-5 shadow-[0_1px_2px_rgba(16,29,51,0.04),0_8px_24px_-16px_rgba(16,29,51,0.15)] transition-colors hover:bg-cream-100/60"
    >
      <span
        className={cn("absolute inset-y-0 left-0 w-1.5", entityColorClass(partner.color, partner.companyName))}
      />
      <div className="flex items-center gap-3">
        <AvatarChip name={partner.companyName} color={partner.color} />
        <div className="min-w-0 flex-1">
          <p className="font-heading text-base font-medium text-navy-900 truncate">{partner.companyName}</p>
          {partner.contactName && <p className="text-sm text-navy-400 truncate">{partner.contactName}</p>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={partner.active ? "sage" : "slate"}>{partner.active ? "Active" : "Inactive"}</Badge>
        <Badge tone="navy">
          {partner.referralCount} referral{partner.referralCount === 1 ? "" : "s"}
        </Badge>
      </div>
      <div className="flex items-end justify-between border-t border-navy-100 pt-3">
        <div className="flex gap-5">
          <div>
            <p className="font-heading text-lg text-sage-700">{formatCurrency(partner.revenueGenerated)}</p>
            <p className="text-xs text-navy-400">revenue</p>
          </div>
          <div>
            <p className="font-heading text-lg text-navy-900">{formatCurrency(partner.amountOwed)}</p>
            <p className="text-xs text-navy-400">owed</p>
          </div>
        </div>
        <ChevronRight size={18} className="text-navy-300 group-hover:text-navy-500 transition-colors shrink-0" />
      </div>
    </Link>
  );
}
