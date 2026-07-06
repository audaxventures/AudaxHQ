import Link from "next/link";
import { ChevronRight, CalendarClock } from "lucide-react";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { LeadStatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, isOverdue } from "@/lib/format";
import { entityColorClass } from "@/lib/avatar";
import { cn } from "@/lib/cn";
import type { Lead } from "@/lib/types";

export function LeadListRow({
  lead,
  today,
}: {
  lead: Lead & { nextFollowUpDate: string | null };
  today: string;
}) {
  const overdue = isOverdue(lead.nextFollowUpDate, today) && lead.status !== "WON" && lead.status !== "LOST";

  return (
    <Link
      href={`/leads/${lead.id}`}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl bg-white py-4 pl-6 pr-5 shadow-[0_1px_2px_rgba(16,29,51,0.04),0_8px_24px_-16px_rgba(16,29,51,0.15)] transition-colors hover:bg-cream-100/60 sm:flex-row sm:items-center sm:gap-4"
    >
      <span
        className={cn("absolute inset-y-0 left-0 w-1.5", entityColorClass(lead.color, lead.companyName))}
      />
      <div className="flex items-center gap-4">
        <AvatarChip name={lead.companyName} color={lead.color} />
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
        <ChevronRight size={18} className="shrink-0 text-navy-300 group-hover:text-navy-500 transition-colors sm:hidden" />
      </div>
      {lead.estimatedValue && (
        <div className="text-right shrink-0 sm:ml-auto">
          <p className="font-heading text-base text-navy-900">{formatCurrency(lead.estimatedValue)}</p>
          <p className="text-xs text-navy-400">est. value</p>
        </div>
      )}
      <ChevronRight size={18} className="hidden shrink-0 text-navy-300 group-hover:text-navy-500 transition-colors sm:block" />
    </Link>
  );
}
