import Link from "next/link";
import { Receipt } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge, InvoiceAgeBracketBadge } from "@/components/ui/Badge";
import { InvoiceAgingFilterBar } from "@/components/invoicing/InvoiceAgingFilterBar";
import { listOutstandingInvoices } from "@/lib/data/invoicing";
import { markInvoicePaid } from "@/lib/actions/invoicing";
import { formatCurrency, formatDate } from "@/lib/format";
import { CLIENT_TYPE_LABELS, invoiceAgeBracket } from "@/lib/types";
import type { ClientType, InvoiceAgeBracket } from "@/lib/types";

export default async function InvoiceAgingPage({
  searchParams,
}: {
  searchParams: Promise<{ clientType?: string; bracket?: string }>;
}) {
  const { clientType, bracket } = await searchParams;
  const invoices = await listOutstandingInvoices({
    clientType: clientType as ClientType | undefined,
    bracket: bracket as InvoiceAgeBracket | undefined,
  });

  const totalOutstanding = invoices.reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div>
      <PageHeader
        icon={Receipt}
        tone="burnt"
        eyebrow="Invoicing"
        title="Invoice Aging"
        description="Every invoice that's been sent but not yet paid, oldest first."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card tone="burnt" className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-navy-400 mb-2">
            Total outstanding
          </p>
          <p className="font-heading text-3xl text-navy-900">{formatCurrency(totalOutstanding)}</p>
        </Card>
        <Card tone="burnt" className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-navy-400 mb-2">
            Invoices shown
          </p>
          <p className="font-heading text-3xl text-navy-900">{invoices.length}</p>
        </Card>
      </div>

      <InvoiceAgingFilterBar clientType={clientType} bracket={bracket} />

      {invoices.length === 0 ? (
        <EmptyState
          title="Nothing outstanding"
          description="No sent-but-unpaid invoices match this filter."
        />
      ) : (
        <Card tone="burnt" className="divide-y divide-navy-100 overflow-hidden">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Link
                    href={`/clients/${inv.clientId}`}
                    className="font-heading text-base font-medium text-navy-900 hover:text-burnt-600 transition-colors"
                  >
                    {inv.clientName}
                  </Link>
                  <Badge tone={inv.clientType === "PROJECT" ? "navy" : "slate"}>
                    {CLIENT_TYPE_LABELS[inv.clientType]}
                  </Badge>
                  <InvoiceAgeBracketBadge bracket={invoiceAgeBracket(inv.daysOutstanding)} />
                </div>
                <p className="text-sm text-navy-600">{inv.label}</p>
                <p className="mt-0.5 text-xs text-navy-400">
                  Invoiced {formatDate(inv.invoicedDate)}
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="font-heading text-lg text-navy-900">{formatCurrency(inv.amount)}</p>
                  <p className="text-xs text-navy-400">
                    {inv.daysOutstanding} {inv.daysOutstanding === 1 ? "day" : "days"} outstanding
                  </p>
                </div>
                <form action={markInvoicePaid.bind(null, inv.clientId, inv.id)}>
                  <button
                    type="submit"
                    className="rounded-lg border border-navy-200 px-3 py-1.5 text-sm font-medium text-navy-600 hover:bg-navy-100 cursor-pointer whitespace-nowrap"
                  >
                    Mark paid
                  </button>
                </form>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
