import { NextResponse } from "next/server";
import { listInvoicesForReport, type RevenueReportRow } from "@/lib/data/revenue";
import { getClientCompanyName } from "@/lib/data/clients";
import { getBusinessToday } from "@/lib/data/businesses";
import { csvRow, csvResponseHeaders } from "@/lib/csv";
import { formatDateInput } from "@/lib/format";
import { getCurrentUser } from "@/lib/currentUser";

function invoiceRow(inv: RevenueReportRow): string {
  return csvRow([
    formatDateInput(inv.invoicedDate),
    inv.clientName,
    inv.label,
    inv.workTypeName ?? "",
    inv.status === "PAID" ? "Paid" : "Unpaid",
    formatDateInput(inv.paidDate),
    inv.amount,
  ]);
}

// GET /api/reports/invoices/csv?clientId=&dateFrom=&dateTo=
// Owner-only. Same filters and year-to-date default as the PDF export —
// meant for importing straight into bookkeeping software.
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return new NextResponse("Not authorized", { status: 403 });
  }

  const today = await getBusinessToday(user.businessId);
  const params = new URL(request.url).searchParams;
  const clientId = params.get("clientId") || undefined;
  const hasExplicitRange = params.has("dateFrom") || params.has("dateTo");
  const dateFrom = params.get("dateFrom") || (hasExplicitRange ? undefined : `${today.slice(0, 4)}-01-01`);
  const dateTo = params.get("dateTo") || undefined;

  const [rows, clientName] = await Promise.all([
    listInvoicesForReport(user.businessId, today, { clientId, dateFrom, dateTo }),
    clientId ? getClientCompanyName(clientId, user.businessId) : Promise.resolve(null),
  ]);

  const lines: string[] = [];
  lines.push(csvRow(["Date", "Client", "Invoice", "Type of work", "Status", "Paid date", "Amount"]));
  for (const inv of rows) {
    lines.push(invoiceRow(inv));
  }
  const totalPaid = rows.filter((r) => r.status === "PAID").reduce((sum, r) => sum + Number(r.amount), 0);
  const totalUnpaid = rows.filter((r) => r.status === "INVOICED").reduce((sum, r) => sum + Number(r.amount), 0);
  lines.push("");
  lines.push(csvRow(["Total paid", totalPaid.toFixed(2)]));
  lines.push(csvRow(["Total unpaid", totalUnpaid.toFixed(2)]));

  const csv = lines.join("\r\n");
  const namePart = (clientName ?? "all-clients").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const filename = `invoices-${namePart}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, { headers: csvResponseHeaders(filename) });
}
