import { AlertTriangle, PieChart, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PanelHeading } from "@/components/ui/PanelHeading";
import { CostEntryLog } from "@/components/tracker/CostEntryLog";
import { CostDateRangeFilter } from "@/components/CostDateRangeFilter";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";
import { buildCostSummary } from "@/lib/data/costEntries";
import type { CostEntry, TeamMember, WorkCategory } from "@/lib/types";

interface OwnerOption {
  id: string;
  companyName: string;
}

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
  clients,
  leads,
  teamMembers,
  workCategories,
  totalInvoiced,
  budgetedHours,
  reportHref,
  logHref,
  dateFrom,
  dateTo,
}: {
  entries: CostEntry[];
  clients: OwnerOption[];
  leads: OwnerOption[];
  teamMembers: TeamMember[];
  workCategories: WorkCategory[];
  totalInvoiced: number;
  budgetedHours: number | null;
  reportHref: string;
  /** Quick link to the Tracker's log-entry drawer, pre-selecting this client/lead as the owner. */
  logHref: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const summary = buildCostSummary(entries, totalInvoiced, budgetedHours);

  return (
    <Card className="p-6">
      <PanelHeading
        icon={PieChart}
        tone="slate"
        title="Cost & profitability"
        action={
          <div className="flex items-center gap-4">
            <a href={logHref} className="inline-flex items-center gap-1 text-sm font-medium text-burnt-600 hover:text-burnt-700 hover:underline">
              <Plus size={14} /> Log time / cost
            </a>
            <a href={reportHref} className="text-sm font-medium text-burnt-600 hover:text-burnt-700 hover:underline">
              Download report
            </a>
          </div>
        }
      />

      <CostDateRangeFilter dateFrom={dateFrom} dateTo={dateTo} />

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

      {summary.categoryBreakdown.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-navy-500">Hours by category</p>
          <div className="overflow-x-auto rounded-lg border border-navy-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100 bg-cream-100/40 text-left text-xs font-medium uppercase tracking-wide text-navy-400">
                  <th className="py-2 pl-3 pr-4">Category</th>
                  <th className="py-2 pr-4">Billable hrs</th>
                  <th className="py-2 pr-4">Non-billable hrs</th>
                  <th className="py-2 pl-4 pr-3 text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {summary.categoryBreakdown.map((c) => (
                  <tr key={c.categoryId ?? "uncategorized"}>
                    <td className="py-2 pl-3 pr-4 font-medium text-navy-800">{c.categoryName}</td>
                    <td className="py-2 pr-4 tabular-nums text-navy-600">{c.billableHours.toFixed(1)}</td>
                    <td className="py-2 pr-4 tabular-nums text-navy-600">{c.nonBillableHours.toFixed(1)}</td>
                    <td className="py-2 pl-4 pr-3 text-right font-medium tabular-nums text-navy-900">
                      {formatCurrency(c.cost)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-cream-100/40 font-medium">
                  <td className="py-2 pl-3 pr-4 text-navy-900">Total</td>
                  <td className="py-2 pr-4 tabular-nums text-navy-900">{summary.billableHours.toFixed(1)}</td>
                  <td className="py-2 pr-4 tabular-nums text-navy-900">{summary.nonBillableHours.toFixed(1)}</td>
                  <td className="py-2 pl-4 pr-3 text-right tabular-nums text-navy-900">
                    {formatCurrency(summary.variableCost)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CostEntryLog entries={entries} clients={clients} leads={leads} teamMembers={teamMembers} workCategories={workCategories} />
    </Card>
  );
}
