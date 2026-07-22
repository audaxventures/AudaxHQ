import { NextResponse } from "next/server";
import { listInvoicesForReport } from "@/lib/data/revenue";
import { getClientCompanyName } from "@/lib/data/clients";
import { getBusinessToday } from "@/lib/data/businesses";
import { renderInvoiceReportPdf } from "@/lib/pdf/invoiceReportPdf";
import { formatDate } from "@/lib/format";
import { getCurrentUser } from "@/lib/currentUser";

function rangeLabel(dateFrom?: string, dateTo?: string): string {
  if (!dateFrom && !dateTo) return "All time";
  if (dateFrom && dateTo) return `${formatDate(dateFrom)} – ${formatDate(dateTo)}`;
  if (dateFrom) return `From ${formatDate(dateFrom)}`;
  return `Through ${formatDate(dateTo!)}`;
}

// GET /api/reports/invoices/pdf?clientId=&dateFrom=&dateTo=
// Owner-only. Defaults to year-to-date when no explicit range is given —
// the common case for this export is a bookkeeping/bank-reconciliation
// report, not whatever the on-screen "this month" default is.
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

  const pdf = await renderInvoiceReportPdf({
    business: { name: user.business.name, logoUrl: user.business.logoUrl },
    clientName,
    rangeLabel: rangeLabel(dateFrom, dateTo),
    rows,
  });

  const namePart = (clientName ?? "All Clients").replace(/[^a-zA-Z0-9 ]/g, "").trim();
  const filename = `Invoices - ${namePart} - ${new Date().toISOString().slice(0, 10)}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
