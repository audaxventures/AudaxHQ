import Link from "next/link";
import { ChevronRight, FileStack, Receipt } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { Badge, InvoiceAgeBracketBadge } from "@/components/ui/Badge";
import { InvoiceAgingFilterBar } from "@/components/invoicing/InvoiceAgingFilterBar";
import { listOutstandingInvoices } from "@/lib/data/invoicing";
import { getAppSettings } from "@/lib/data/appSettings";
import { markInvoicePaid } from "@/lib/actions/invoicing";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { CLIENT_TYPE_LABELS, invoiceAgeBracket, invoiceAgeBracketLabels } from "@/lib/types";
import type { ClientType, InvoiceAgeBracket } from "@/lib/types";

const DAYS_OUTSTANDING_TEXT_TONE: Record<InvoiceAgeBracket, string> = {
  UNDER_15: "text-sage-600",
  DAYS_15_30: "text-gold-600",
  OVER_30: "text-brick-600",
};

export default async function InvoiceAgingPage({
  searchParams,
}: {
  searchParams: Promise<{ clientType?: string; bracket?: string }>;
}) {
  const { clientType, bracket } = await searchParams;
  const settings = await getAppSettings();
  const thresholds = { underDays: settings.invoiceAgingUnderDays, overDays: settings.invoiceAgingOverDays };
  const bracketLabels = invoiceAgeBracketLabels(thresholds.underDays, thresholds.overDays);
  const invoices = await listOutstandingInvoices(
    {
      clientType: clientType as ClientType | undefined,
      bracket: bracket as InvoiceAgeBracket | undefined,
    },
    thresholds
  );

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
        <Card tone="burnt" variant="solid" className="p-5 flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-white/80 text-burnt-600 shadow-sm">
            <Receipt size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-2xl font-semibold text-navy-900 tabular-nums leading-tight">
              {formatCurrency(totalOutstanding)}
            </p>
            <p className="text-xs font-semibold text-navy-600">Total outstanding</p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-burnt-600 shadow-sm">
            <ChevronRight size={16} />
          </div>
        </Card>
        <Card tone="burnt" variant="solid" className="p-5 flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-white/80 text-burnt-600 shadow-sm">
            <FileStack size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-2xl font-semibold text-navy-900 tabular-nums leading-tight">
              {invoices.length}
            </p>
            <p className="text-xs font-semibold text-navy-600">Invoices shown</p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-burnt-600 shadow-sm">
            <ChevronRight size={16} />
          </div>
        </Card>
      </div>

      <InvoiceAgingFilterBar clientType={clientType} bracket={bracket} bracketLabels={bracketLabels} />

      {invoices.length === 0 ? (
        <EmptyState
          title="Nothing outstanding"
          description="No sent-but-unpaid invoices match this filter."
        />
      ) : (
        <>
          <div className="hidden px-5 pb-2 sm:flex sm:items-center sm:gap-3">
            <p className="flex-1 text-xs font-medium uppercase tracking-wide text-navy-400">
              Client / Invoice
            </p>
            <p className="w-28 shrink-0 text-right text-xs font-medium uppercase tracking-wide text-navy-400">
              Amount
            </p>
            <p className="w-36 shrink-0 text-right text-xs font-medium uppercase tracking-wide text-navy-400">
              Days outstanding
            </p>
            <span className="w-[104px] shrink-0" />
          </div>
          <div className="space-y-3">
            {invoices.map((inv) => {
              const bracket = invoiceAgeBracket(inv.daysOutstanding, thresholds.underDays, thresholds.overDays);
              return (
                <div
                  key={inv.id}
                  className="flex flex-col gap-3 rounded-2xl bg-white px-5 py-4 shadow-[0_1px_2px_rgba(16,29,51,0.04),0_8px_24px_-16px_rgba(16,29,51,0.15)] sm:flex-row sm:items-center"
                >
                  <div className="flex flex-1 items-start gap-3.5 min-w-0">
                    <AvatarChip name={inv.clientName} />
                    <div className="min-w-0 flex-1">
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
                        <InvoiceAgeBracketBadge bracket={bracket} label={bracketLabels[bracket]} />
                      </div>
                      <p className="text-sm text-navy-600">{inv.label}</p>
                      <p className="mt-0.5 text-xs text-navy-400">
                        Invoiced {formatDate(inv.invoicedDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pl-[52px] sm:flex-nowrap sm:pl-0">
                    <div className="shrink-0 sm:w-28 sm:text-right">
                      <p className="font-heading text-lg text-navy-900">{formatCurrency(inv.amount)}</p>
                    </div>
                    <div className="shrink-0 sm:w-36 sm:text-right">
                      <p className={cn("text-sm font-medium", DAYS_OUTSTANDING_TEXT_TONE[bracket])}>
                        {inv.daysOutstanding} {inv.daysOutstanding === 1 ? "day" : "days"}
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
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
