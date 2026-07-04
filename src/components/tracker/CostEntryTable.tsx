"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCurrency, formatDate } from "@/lib/format";
import { FIXED_COST_CATEGORY_LABELS } from "@/lib/types";
import type { CostEntry } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { deleteFixedCost, deleteTimeEntry } from "@/app/(app)/tracker/actions";

export function CostEntryTable({
  entries,
  showOwner = false,
  deletable = false,
}: {
  entries: CostEntry[];
  showOwner?: boolean;
  deletable?: boolean;
}) {
  const [, startTransition] = useTransition();

  if (entries.length === 0) {
    return (
      <EmptyState
        title="No entries yet"
        description="Time and cost entries will show up here once you add them."
      />
    );
  }

  function handleDelete(entry: CostEntry) {
    startTransition(() => {
      if (entry.entryType === "TIME") {
        void deleteTimeEntry(entry.id, entry.clientId, entry.leadId);
      } else {
        void deleteFixedCost(entry.id, entry.clientId, entry.leadId);
      }
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-navy-100 text-left text-xs font-medium uppercase tracking-wide text-navy-400">
            <th className="py-2 pr-4">Date</th>
            {showOwner && <th className="py-2 pr-4">Client / Lead</th>}
            <th className="py-2 pr-4">Type</th>
            <th className="py-2 pr-4">Team member</th>
            <th className="py-2 pr-4">Category</th>
            <th className="py-2 pr-4">Description</th>
            <th className="py-2 pr-4">Hours</th>
            <th className="py-2 pr-4">Rate</th>
            <th className="py-2 pr-4">Billable</th>
            <th className="py-2 pl-4 text-right">Amount</th>
            {deletable && <th className="py-2 pl-2" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-100">
          {entries.map((e) => (
            <tr key={`${e.entryType}-${e.id}`} className="group">
              <td className="py-2.5 pr-4 whitespace-nowrap text-navy-600">{formatDate(e.date)}</td>
              {showOwner && (
                <td className="py-2.5 pr-4 whitespace-nowrap font-medium text-navy-800">{e.ownerName}</td>
              )}
              <td className="py-2.5 pr-4 whitespace-nowrap text-navy-600">
                {e.entryType === "TIME" ? "Time" : "Fixed cost"}
              </td>
              <td className="py-2.5 pr-4 whitespace-nowrap text-navy-600">{e.teamMemberName ?? "—"}</td>
              <td className="py-2.5 pr-4 whitespace-nowrap text-navy-600">
                {e.entryType === "TIME"
                  ? e.workCategoryName ?? "Uncategorized"
                  : e.category
                    ? FIXED_COST_CATEGORY_LABELS[e.category]
                    : "—"}
              </td>
              <td className="py-2.5 pr-4 max-w-xs truncate text-navy-600">{e.description || "—"}</td>
              <td className="py-2.5 pr-4 tabular-nums text-navy-600">{e.hours ?? "—"}</td>
              <td className="py-2.5 pr-4 tabular-nums text-navy-600">
                {e.rate !== null ? formatCurrency(e.rate) : "—"}
              </td>
              <td className="py-2.5 pr-4">
                {e.entryType === "TIME" ? (
                  <span className={cn("text-xs font-medium", e.billable ? "text-sage-600" : "text-navy-400")}>
                    {e.billable ? "Billable" : "Non-billable"}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="py-2.5 pl-4 text-right font-medium tabular-nums text-navy-900">
                {formatCurrency(e.amount)}
              </td>
              {deletable && (
                <td className="py-2.5 pl-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(e)}
                    className="p-1 text-navy-300 opacity-0 transition-opacity hover:text-brick-600 group-hover:opacity-100 cursor-pointer"
                    aria-label="Delete entry"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
