"use client";

import { useState, useTransition } from "react";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldGroup } from "@/components/ui/Field";
import { SectionPanel } from "@/components/ui/SectionPanel";
import { formatCurrency, formatDate } from "@/lib/format";
import type { CostEntry } from "@/lib/types";
import { generateHourlyInvoiceFromUnbilledHours } from "@/app/(app)/clients/actions";

/** Lets the owner bundle a client's unbilled billable hours (billable time entries with no invoiceId — see migration 044) into one new hourly invoice, at a rate defaulted from the client's hourlyRate but overridable per batch. Marks the selected entries billed so they can't be pulled into a second invoice later. */
export function UnbilledHoursPanel({
  clientId,
  entries,
  defaultRate,
}: {
  clientId: string;
  entries: CostEntry[];
  defaultRate: string | null;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(entries.map((e) => e.id)));
  const [rate, setRate] = useState(defaultRate ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (entries.length === 0) return null;

  const selectedEntries = entries.filter((e) => selected.has(e.id));
  const totalHours = selectedEntries.reduce((sum, e) => sum + (e.hours ?? 0), 0);
  const rateNumber = Number(rate) || 0;
  const totalAmount = totalHours * rateNumber;
  const allSelected = selected.size === entries.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(entries.map((e) => e.id)));
  }

  return (
    <SectionPanel eyebrow="Unbilled" title="Ready to invoice" description="Select the hours to bundle into a new hourly invoice." tone="sage">
      <div className="overflow-x-auto rounded-lg border border-navy-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-100 bg-cream-100/40 text-left text-xs font-medium uppercase tracking-wide text-navy-400">
              <th className="py-2 pl-3 pr-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-navy-300"
                  aria-label="Select all"
                />
              </th>
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Team member</th>
              <th className="py-2 pr-4">Description</th>
              <th className="py-2 pr-3 text-right">Hours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="py-2 pl-3 pr-2">
                  <input
                    type="checkbox"
                    checked={selected.has(e.id)}
                    onChange={() => toggle(e.id)}
                    className="rounded border-navy-300"
                    aria-label={`Select entry from ${formatDate(e.date)}`}
                  />
                </td>
                <td className="py-2 pr-4 whitespace-nowrap text-navy-600">{formatDate(e.date)}</td>
                <td className="py-2 pr-4 whitespace-nowrap text-navy-600">{e.teamMemberName ?? "—"}</td>
                <td className="py-2 pr-4 text-navy-600">{e.description ?? "—"}</td>
                <td className="py-2 pr-3 text-right tabular-nums text-navy-700">{e.hours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            try {
              await generateHourlyInvoiceFromUnbilledHours(clientId, formData);
              setSelected(new Set());
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not generate the invoice.");
            }
          });
        }}
        className="mt-4 flex flex-wrap items-end gap-3"
      >
        {[...selected].map((id) => (
          <input key={id} type="hidden" name="entryId" value={id} />
        ))}
        <FieldGroup className="w-32">
          <Label htmlFor="unbilled-rate">Rate ($/hr)</Label>
          <Input
            id="unbilled-rate"
            name="rate"
            type="number"
            step="0.01"
            min="0.01"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            required
          />
        </FieldGroup>
        <div className="pb-2 text-sm text-navy-600">
          {totalHours.toFixed(1)} hrs × {formatCurrency(rateNumber)}/hr ={" "}
          <span className="font-medium text-navy-900">{formatCurrency(totalAmount)}</span>
        </div>
        <Button type="submit" size="sm" disabled={pending || selected.size === 0}>
          <Receipt size={14} /> {pending ? "Generating…" : "Generate invoice"}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-brick-600">{error}</p>}
    </SectionPanel>
  );
}
