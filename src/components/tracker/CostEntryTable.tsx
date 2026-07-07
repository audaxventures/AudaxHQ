"use client";

import { useState, useTransition } from "react";
import { Check, MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCurrency, formatDate, formatDateInput } from "@/lib/format";
import { FIXED_COST_CATEGORY_LABELS } from "@/lib/types";
import type { CostEntry } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { deleteFixedCost, deleteTimeEntry } from "@/app/(app)/tracker/actions";

type PillTone = "sage" | "gold" | "brick" | "slate" | "burnt" | "navy" | "blue";

const PILL_TONES: PillTone[] = ["sage", "gold", "brick", "slate", "burnt", "navy", "blue"];

const PILL_TONE_CLASSES: Record<PillTone, string> = {
  sage: "bg-sage-100 text-sage-600",
  gold: "bg-gold-100 text-gold-600",
  brick: "bg-brick-100 text-brick-600",
  slate: "bg-slate-100 text-slate-600",
  burnt: "bg-burnt-100 text-burnt-600",
  navy: "bg-navy-100 text-navy-700",
  blue: "bg-blue-100 text-blue-600",
};

function categoryTone(seed: string): PillTone {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PILL_TONES[hash % PILL_TONES.length];
}

function CategoryPill({ label }: { label: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap", PILL_TONE_CLASSES[categoryTone(label)])}>
      {label}
    </span>
  );
}

function entryCategoryLabel(entry: CostEntry): string {
  if (entry.entryType === "TIME") return entry.workCategoryName ?? "Uncategorized";
  return entry.category ? FIXED_COST_CATEGORY_LABELS[entry.category] : "Uncategorized";
}

function entryFinancials(entry: CostEntry): { revenue: number; cost: number; profit: number } {
  if (entry.entryType === "TIME" && entry.billable) {
    return { revenue: entry.amount, cost: entry.amount, profit: 0 };
  }
  return { revenue: 0, cost: entry.amount, profit: -entry.amount };
}

function RowActions({ onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="rounded-md p-1 text-navy-400 transition-colors hover:bg-navy-100 hover:text-navy-700 cursor-pointer"
        aria-label="Entry actions"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-lg border border-navy-100 bg-white py-1 shadow-lg">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="block w-full px-3 py-1.5 text-left text-sm text-navy-700 hover:bg-navy-100 cursor-pointer"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="block w-full px-3 py-1.5 text-left text-sm text-brick-600 hover:bg-brick-100 cursor-pointer"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function CostEntryTable({
  entries,
  showOwner = false,
  deletable = false,
  hideFinancials = false,
  onEdit,
}: {
  entries: CostEntry[];
  showOwner?: boolean;
  deletable?: boolean;
  /** Team members don't see client billing figures — omit the Rate/Cost/Revenue/Profit columns. */
  hideFinancials?: boolean;
  /** When set, an "Edit" action is added to each row's menu that calls this with the entry to edit. */
  onEdit?: (entry: CostEntry) => void;
}) {
  const [, startTransition] = useTransition();

  if (entries.length === 0) {
    return <EmptyState title="No entries yet" description="Time and cost entries will show up here once you add them." />;
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

  const groups: { date: string; entries: CostEntry[] }[] = [];
  for (const entry of entries) {
    const dateKey = formatDateInput(entry.date);
    const last = groups[groups.length - 1];
    if (last && last.date === dateKey) {
      last.entries.push(entry);
    } else {
      groups.push({ date: dateKey, entries: [entry] });
    }
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-left text-xs font-medium uppercase tracking-wide text-navy-400">
              {showOwner && <th className="py-2 pr-4">Client / Lead</th>}
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Team member</th>
              <th className="py-2 pr-4">Hours</th>
              <th className="py-2 pr-4">Billable</th>
              {!hideFinancials && (
                <>
                  <th className="py-2 pr-4">Rate</th>
                  <th className="py-2 pr-4 text-right">Cost</th>
                  <th className="py-2 pr-4 text-right">Revenue</th>
                  <th className="py-2 pr-4 text-right">Profit</th>
                </>
              )}
              {(deletable || onEdit) && <th className="py-2 pl-2" />}
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody key={group.date} className="divide-y divide-navy-100">
              <tr>
                <td
                  colSpan={(showOwner ? 1 : 0) + (hideFinancials ? 4 : 8) + (deletable || onEdit ? 1 : 0)}
                  className="pt-4 pb-1.5 text-xs font-semibold uppercase tracking-wide text-navy-400"
                >
                  {formatDate(group.date)}
                </td>
              </tr>
              {group.entries.map((e) => {
                const { revenue, cost, profit } = entryFinancials(e);
                return (
                  <tr key={`${e.entryType}-${e.id}`} className="group">
                    {showOwner && (
                      <td className="py-2.5 pr-4 whitespace-nowrap font-medium text-navy-800">{e.ownerName}</td>
                    )}
                    <td className="py-2.5 pr-4">
                      <CategoryPill label={entryCategoryLabel(e)} />
                    </td>
                    <td className="py-2.5 pr-4 whitespace-nowrap text-navy-600">{e.teamMemberName ?? "—"}</td>
                    <td className="py-2.5 pr-4 tabular-nums text-navy-600">{e.hours ?? "—"}</td>
                    <td className="py-2.5 pr-4">
                      {e.entryType === "TIME" ? (
                        e.billable ? (
                          <Check size={16} className="text-sage-600" aria-label="Billable" />
                        ) : (
                          <X size={16} className="text-navy-300" aria-label="Non-billable" />
                        )
                      ) : (
                        "—"
                      )}
                    </td>
                    {!hideFinancials && (
                      <>
                        <td className="py-2.5 pr-4 tabular-nums text-navy-600">
                          {e.rate !== null ? formatCurrency(e.rate) : "—"}
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-navy-600">{formatCurrency(cost)}</td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-navy-600">{formatCurrency(revenue)}</td>
                        <td
                          className={cn(
                            "py-2.5 pr-4 text-right font-medium tabular-nums",
                            profit < 0 ? "text-brick-600" : "text-navy-900"
                          )}
                        >
                          {formatCurrency(profit)}
                        </td>
                      </>
                    )}
                    {(deletable || onEdit) && (
                      <td className="py-2.5 pl-2 text-right">
                        <RowActions
                          onEdit={onEdit ? () => onEdit(e) : undefined}
                          onDelete={deletable ? () => handleDelete(e) : undefined}
                        />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}
