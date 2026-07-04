import Link from "next/link";
import { ChevronRight, CalendarClock } from "lucide-react";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { LeadStatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, isOverdue } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Lead } from "@/lib/types";

export function LeadListRow({ lead }: { lead: Lead & { nextFollowUpDate: string | null } }) {
  const overdue = isOverdue(lead.nextFollowUpDate) && lead.status !== "WON" && lead.status !== "LOST";

  return (
    <Link
      href={`/leads/${lead.id}`}
      className="group flex items-center gap-4 px-5 py-4 hover:bg-cream-100/60 transition-colors"
    >
      <AvatarChip name={lead.companyName} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-heading text-base font-medium text-navy-900 truncate">{lead.companyName}</p>
          {lead.contactName && <span className="text-sm text-navy-400 truncate">{lead.contactName}</span>}
        </div>
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <LeadStatusBadge status={lead.status} />
          {lead.nextFollowUpDate ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                overdue ? "text-brick-600" : "text-navy-500"
              )}
            >
              <CalendarClock size={13} />
              {overdue ? "Overdue: " : "Follow up "}
              {formatDate(lead.nextFollowUpDate)}
            </span>
          ) : (
            <span className="text-xs font-medium text-navy-300">No follow-up set</span>
          )}
        </div>
      </div>
      {lead.estimatedValue && (
        <div className="text-right shrink-0">
          <p className="font-heading text-base text-navy-900">{formatCurrency(lead.estimatedValue)}</p>
          <p className="text-xs text-navy-400">est. value</p>
        </div>
      )}
      <ChevronRight size={18} className="text-navy-300 group-hover:text-navy-500 transition-colors shrink-0" />
    </Link>
  );
}
