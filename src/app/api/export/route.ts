import { NextResponse } from "next/server";
import { listClients } from "@/lib/data/clients";
import { listLeads } from "@/lib/data/leads";
import { listAllInvoicesForExport } from "@/lib/data/invoicing";
import { listTasks } from "@/lib/data/todos";
import { listCostEntries } from "@/lib/data/costEntries";
import { csvRow, csvResponseHeaders } from "@/lib/csv";
import { formatDateInput } from "@/lib/format";
import { FIXED_TASK_TYPE_LABELS } from "@/lib/types";

const ENTITIES = ["clients", "leads", "invoices", "tasks", "time-entries", "fixed-costs"] as const;
type Entity = (typeof ENTITIES)[number];

async function buildCsv(entity: Entity): Promise<string> {
  const lines: string[] = [];

  switch (entity) {
    case "clients": {
      const clients = await listClients();
      lines.push(
        csvRow(["Company Name", "Contact Name", "Email", "Phone", "Type", "Status", "Rate", "Work Type", "Start Date", "Budgeted Hours"])
      );
      for (const c of clients) {
        lines.push(
          csvRow([
            c.companyName,
            c.contactName ?? "",
            c.contactEmail ?? "",
            c.contactPhone ?? "",
            c.type,
            c.status,
            c.rate,
            c.workTypeOther || c.workTypeName || "",
            formatDateInput(c.startDate),
            c.budgetedHours ?? "",
          ])
        );
      }
      break;
    }
    case "leads": {
      const leads = await listLeads();
      lines.push(
        csvRow(["Company Name", "Contact Name", "Email", "Phone", "Status", "Estimated Value", "Work Type", "Source", "Created At"])
      );
      for (const l of leads) {
        lines.push(
          csvRow([
            l.companyName,
            l.contactName ?? "",
            l.contactEmail ?? "",
            l.contactPhone ?? "",
            l.status,
            l.estimatedValue ?? "",
            l.workTypeOther || l.workTypeName || "",
            l.sourceOther || l.sourceName || "",
            formatDateInput(l.createdAt),
          ])
        );
      }
      break;
    }
    case "invoices": {
      const invoices = await listAllInvoicesForExport();
      lines.push(csvRow(["Client", "Label", "Amount", "Status", "Invoiced Date", "Paid Date", "Period"]));
      for (const i of invoices) {
        lines.push(
          csvRow([
            i.clientName,
            i.label,
            i.amount,
            i.status,
            formatDateInput(i.invoicedDate),
            formatDateInput(i.paidDate),
            i.periodMonth && i.periodYear ? `${i.periodMonth}/${i.periodYear}` : "",
          ])
        );
      }
      break;
    }
    case "tasks": {
      const tasks = await listTasks();
      lines.push(csvRow(["Title", "Description", "Due Date", "Status", "Type", "Client", "Lead", "Tags", "Created At"]));
      for (const t of tasks) {
        lines.push(
          csvRow([
            t.title,
            t.description ?? "",
            formatDateInput(t.dueDate),
            t.status,
            t.type === "CUSTOM" ? t.todoTypeName ?? "" : FIXED_TASK_TYPE_LABELS[t.type],
            t.clientName ?? "",
            t.leadName ?? "",
            t.tags.join("; "),
            formatDateInput(t.createdAt),
          ])
        );
      }
      break;
    }
    case "time-entries": {
      const entries = (await listCostEntries()).filter((e) => e.entryType === "TIME");
      lines.push(csvRow(["Date", "Client / Lead", "Team Member", "Category", "Hours", "Rate", "Billable", "Description", "Amount"]));
      for (const e of entries) {
        lines.push(
          csvRow([
            formatDateInput(e.date),
            e.ownerName,
            e.teamMemberName ?? "",
            e.workCategoryName ?? "Uncategorized",
            e.hours ?? "",
            e.rate ?? "",
            e.billable ? "Yes" : "No",
            e.description ?? "",
            e.amount.toFixed(2),
          ])
        );
      }
      break;
    }
    case "fixed-costs": {
      const entries = (await listCostEntries()).filter((e) => e.entryType === "FIXED_COST");
      lines.push(csvRow(["Date", "Client / Lead", "Description", "Category", "Amount"]));
      for (const e of entries) {
        lines.push(csvRow([formatDateInput(e.date), e.ownerName, e.description ?? "", e.category ?? "", e.amount.toFixed(2)]));
      }
      break;
    }
  }

  return lines.join("\r\n");
}

// GET /api/export?entity=clients|leads|invoices|tasks|time-entries|fixed-costs
export async function GET(request: Request) {
  const entityParam = new URL(request.url).searchParams.get("entity");
  if (!ENTITIES.includes(entityParam as Entity)) {
    return NextResponse.json({ error: "Unknown entity" }, { status: 400 });
  }
  const entity = entityParam as Entity;

  const csv = await buildCsv(entity);
  const filename = `audax-hq-${entity}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, { headers: csvResponseHeaders(filename) });
}
