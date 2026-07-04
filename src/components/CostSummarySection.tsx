import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CostEntryTable } from "@/components/tracker/CostEntryTable";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { buildCostSummary } from "@/lib/data/costEntries";
import type { CostEntry } from "@/lib/types";

function Metric({ label, value, tone }: { label: string; value: string; tone?: "sage" | "brick" }) {
  return (
    <div className="rounded-xl border border-navy-100 bg-cream-100/40 px-3.5 py-2.5">
      <p className="text-xs font-medium uppercase tracking-wide text-navy-500">{label}</p>
      <p
        className={cn(
          "mt-0.5 font-heading text-lg",
          tone === "sage" ? "text-sage-600" : tone === "brick" ? "text-brick-600" : "text-navy-900"
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function CostSummarySection({
  entries,
  totalInvoiced,
  budgetedHours,
  reportHref,
}: {
  entries: CostEntry[];
  totalInvoiced: number;
  budgetedHours: number | null;
  reportHref: string;
}) {
  const summary = buildCostSummary(entries, totalInvoiced, budgetedHours);

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-lg font-medium text-navy-900">Cost &amp; profitability</h3>
        <a href={reportHref} className="text-sm font-medium text-burnt-600 hover:text-burnt-700 hover:underline">
          Download report
        </a>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label="Billable hours" value={summary.billableHours.toFixed(1)} />
        <Metric label="Non-billable hours" value={summary.nonBillableHours.toFixed(1)} />
        <Metric label="Total hours" value={summary.totalHours.toFixed(1)} />
        <Metric label="Variable cost" value={formatCurrency(summary.variableCost)} />
        <Metric label="Fixed costs" value={formatCurrency(summary.fixedCost)} />
        <Metric label="Total cost" value={formatCurrency(summary.totalCost)} />
        <Metric label="Total invoiced" value={formatCurrency(summary.totalInvoiced)} />
        <Metric label="Profit" value={formatCurrency(summary.profit)} tone={summary.profit >= 0 ? "sage" : "brick"} />
        <Metric
          label="Profit margin"
          value={summary.profitMarginPercent !== null ? `${summary.profitMarginPercent.toFixed(1)}%` : "—"}
        />
        <Metric
          label="Effective hourly rate"
          value={summary.effectiveHourlyRate !== null ? `${formatCurrency(summary.effectiveHourlyRate)}/hr` : "—"}
        />
      </div>

      {summary.budgetedHours !== null && (
        <div
          className={cn(
            "mb-5 flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
            summary.overBudget ? "bg-brick-100 text-brick-700" : "bg-sage-100 text-sage-700"
          )}
        >
          {summary.overBudget && <AlertTriangle size={14} className="shrink-0" />}
          {summary.totalHours.toFixed(1)} of {summary.budgetedHours.toFixed(1)} budgeted hours used
          {summary.overBudget && " — over budget"}
        </div>
      )}

      <CostEntryTable entries={entries} />
    </Card>
  );
}
