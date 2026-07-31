"use client";

import { Building2, CalendarClock, Mail, Phone } from "lucide-react";
import { Badge, ProspectStatusBadge } from "@/components/ui/Badge";
import { formatDate, isOverdue } from "@/lib/format";
import { entityColorChipClass } from "@/lib/avatar";
import type { Prospect } from "@/lib/types";

export function ProspectListRow({
  prospect,
  today,
  onOpen,
}: {
  prospect: Prospect & { nextFollowUpDate: string | null };
  today: string;
  onOpen: () => void;
}) {
  const overdue = isOverdue(prospect.nextFollowUpDate, today);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full flex-col gap-3 rounded-2xl bg-white py-4 pl-5 pr-5 text-left shadow-[0_1px_2px_rgba(16,29,51,0.04),0_8px_24px_-16px_rgba(16,29,51,0.15)] transition-colors hover:bg-cream-100/60 cursor-pointer sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="flex flex-1 items-center gap-4 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-heading text-base font-medium text-navy-900 truncate">{prospect.name}</p>
            {prospect.businessName && (
              <span className="flex items-center gap-1 text-sm text-navy-400 truncate">
                <Building2 size={13} />
                {prospect.businessName}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            <ProspectStatusBadge status={prospect.status} />
            {prospect.industry && (
              <Badge className={entityColorChipClass(null, prospect.industry)}>{prospect.industry}</Badge>
            )}
            <Badge className={entityColorChipClass(prospect.ownerColor, prospect.ownerName ?? "unassigned")}>
              {prospect.ownerName ?? "Unassigned"}
            </Badge>
            {prospect.nextFollowUpDate ? (
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium ${overdue ? "text-brick-600" : "text-navy-500"}`}
              >
                <CalendarClock size={13} />
                {overdue ? "Overdue: " : "Follow up "}
                {formatDate(prospect.nextFollowUpDate)}
              </span>
            ) : (
              <span className="text-xs font-medium text-navy-300">No follow-up set</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-start gap-1 text-xs text-navy-500 sm:items-end">
        {prospect.email && (
          <span className="flex items-center gap-1">
            <Mail size={12} />
            {prospect.email}
          </span>
        )}
        {prospect.phone && (
          <span className="flex items-center gap-1">
            <Phone size={12} />
            {prospect.phone}
          </span>
        )}
      </div>
    </button>
  );
}
