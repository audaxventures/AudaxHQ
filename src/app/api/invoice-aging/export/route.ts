import { NextResponse } from "next/server";
import { listOutstandingInvoices } from "@/lib/data/invoicing";
import { getBusinessToday } from "@/lib/data/businesses";
import { csvRow, csvResponseHeaders } from "@/lib/csv";
import { formatDateInput } from "@/lib/format";
import { getCurrentUser } from "@/lib/currentUser";
import { CLIENT_TYPE_LABELS, invoiceAgeBracket, invoiceAgeBracketLabels } from "@/lib/types";
import type { ClientType, InvoiceAgeBracket } from "@/lib/types";

// GET /api/invoice-aging/export?clientType=&bracket=
// Exports exactly the outstanding invoices shown on the Invoice Aging
// page, respecting its Client Type / Age filters — distinct from the
// Settings -> Data Export "all invoices ever" backup CSV.
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    return new NextResponse("Not authorized", { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const clientType = (params.get("clientType") as ClientType | null) ?? undefined;
  const bracket = (params.get("bracket") as InvoiceAgeBracket | null) ?? undefined;

  const today = await getBusinessToday(user.businessId);
  const thresholds = { underDays: user.business.invoiceAgingUnderDays, overDays: user.business.invoiceAgingOverDays };
  const bracketLabels = invoiceAgeBracketLabels(thresholds.underDays, thresholds.overDays);
  const invoices = await listOutstandingInvoices({ clientType, bracket }, thresholds, today);

  const lines: string[] = [];
  lines.push(csvRow(["Client", "Type", "Invoice", "Amount", "Invoiced Date", "Days Outstanding", "Age"]));
  for (const inv of invoices) {
    const invBracket = invoiceAgeBracket(inv.daysOutstanding, thresholds.underDays, thresholds.overDays);
    lines.push(
      csvRow([
        inv.clientName,
        CLIENT_TYPE_LABELS[inv.clientType],
        inv.label,
        inv.amount,
        formatDateInput(inv.invoicedDate),
        inv.daysOutstanding,
        bracketLabels[invBracket],
      ])
    );
  }

  const csv = lines.join("\r\n");
  const filename = `audax-hq-invoice-aging-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, { headers: csvResponseHeaders(filename) });
}
