import { NextResponse } from "next/server";
import { listCostEntries, buildCostSummary } from "@/lib/data/costEntries";
import { getClient } from "@/lib/data/clients";
import { getLead } from "@/lib/data/leads";
import { formatDateInput, isDateInRange } from "@/lib/format";
import type { CostEntry } from "@/lib/types";

function csvField(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function csvRow(fields: (string | number)[]): string {
  return fields.map(csvField).join(",");
}

function entryRow(e: CostEntry): string {
  return csvRow([
    formatDateInput(e.date),
    e.entryType === "TIME" ? "Time" : "Fixed Cost",
    e.teamMemberName ?? "",
    e.entryType === "TIME" ? e.workCategoryName ?? "Uncategorized" : "",
    e.description ?? "",
    e.hours ?? "",
    e.rate ?? "",
    e.entryType === "TIME" ? (e.billable ? "Yes" : "No") : "",
    e.amount.toFixed(2),
  ]);
}

// GET /api/reports?clientId=&leadId=&teamMemberId=&workCategoryId=&billable=&dateFrom=&dateTo=&summary=1
//
// Filters mirror the Tracker page's filter bar. `summary=1` (only
// meaningful alongside a single clientId or leadId) prepends the
// profitability numbers — including an hours-by-category breakdown —
// shown on that client/lead's own page. The main Tracker page's
// "Download report" link omits it, since a general log filtered across
// several owners has no single profitability baseline.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const clientId = params.get("clientId") || undefined;
  const leadId = params.get("leadId") || undefined;
  const teamMemberId = params.get("teamMemberId") || undefined;
  const workCategoryId = params.get("workCategoryId") || undefined;
  const billableParam = params.get("billable");
  const billable = billableParam === "true" ? true : billableParam === "false" ? false : undefined;
  const dateFrom = params.get("dateFrom") || undefined;
  const dateTo = params.get("dateTo") || undefined;
  const withSummary = params.get("summary") === "1";

  const entries = await listCostEntries({ clientId, leadId, teamMemberId, workCategoryId, billable, dateFrom, dateTo });

  const lines: string[] = [];

  if (withSummary && (clientId || leadId)) {
    let ownerName = "";
    let totalInvoiced = 0;
    let budgetedHours: number | null = null;

    if (clientId) {
      const client = await getClient(clientId);
      if (client) {
        ownerName = client.companyName;
        totalInvoiced = client.invoices
          .filter((i) => i.status !== "NOT_INVOICED")
          .filter((i) => isDateInRange(i.invoicedDate, dateFrom, dateTo))
          .reduce((sum, i) => sum + Number(i.amount), 0);
        budgetedHours = client.budgetedHours;
      }
    } else if (leadId) {
      const lead = await getLead(leadId);
      if (lead) ownerName = lead.companyName;
    }

    const summary = buildCostSummary(entries, totalInvoiced, budgetedHours);
    lines.push(csvRow(["Report for", ownerName]));
    if (dateFrom || dateTo) {
      lines.push(csvRow(["Date range", `${dateFrom ?? "start"} to ${dateTo ?? "present"}`]));
    }
    lines.push(csvRow(["Billable hours", summary.billableHours]));
    lines.push(csvRow(["Non-billable hours", summary.nonBillableHours]));
    lines.push(csvRow(["Total hours", summary.totalHours]));
    lines.push(csvRow(["Variable cost", summary.variableCost.toFixed(2)]));
    lines.push(csvRow(["Fixed cost", summary.fixedCost.toFixed(2)]));
    lines.push(csvRow(["Total cost", summary.totalCost.toFixed(2)]));
    lines.push(csvRow(["Total invoiced", summary.totalInvoiced.toFixed(2)]));
    lines.push(csvRow(["Profit", summary.profit.toFixed(2)]));
    lines.push(csvRow(["Profit margin %", summary.profitMarginPercent !== null ? summary.profitMarginPercent.toFixed(1) : "N/A"]));
    lines.push(
      csvRow(["Effective hourly rate", summary.effectiveHourlyRate !== null ? summary.effectiveHourlyRate.toFixed(2) : "N/A"])
    );
    if (summary.budgetedHours !== null) {
      lines.push(csvRow(["Budgeted hours", summary.budgetedHours]));
    }
    lines.push("");

    if (summary.categoryBreakdown.length > 0) {
      lines.push(csvRow(["Hours by category", "Billable hrs", "Non-billable hrs", "Cost"]));
      for (const c of summary.categoryBreakdown) {
        lines.push(csvRow([c.categoryName, c.billableHours, c.nonBillableHours, c.cost.toFixed(2)]));
      }
      lines.push(csvRow(["Total", summary.billableHours, summary.nonBillableHours, summary.variableCost.toFixed(2)]));
      lines.push("");
    }
  }

  lines.push(csvRow(["Date", "Type", "Team member", "Category", "Description", "Hours", "Rate", "Billable", "Amount"]));
  for (const entry of entries) {
    lines.push(entryRow(entry));
  }

  const csv = lines.join("\r\n");
  const filename = `audax-hq-report-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
