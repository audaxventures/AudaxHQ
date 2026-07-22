import Link from "next/link";
import { ChevronRight, FileStack, Receipt, TrendingUp, Wallet, Download, FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { PanelHeading } from "@/components/ui/PanelHeading";
import { EmptyState } from "@/components/ui/EmptyState";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { Badge, InvoiceAgeBracketBadge, InvoiceStatusBadge } from "@/components/ui/Badge";
import { InvoiceAgingFilterBar } from "@/components/invoicing/InvoiceAgingFilterBar";
import { RevenueFilters } from "@/components/invoicing/RevenueFilters";
import { RevenueTrendChart } from "@/components/invoicing/RevenueTrendChart";
import { listOutstandingInvoices } from "@/lib/data/invoicing";
import {
  getRevenueSummary,
  getRevenueTrend,
  getRevenueByWorkType,
  getRecurringVsProjectSplit,
  listInvoicesForReport,
  monthBounds,
} from "@/lib/data/revenue";
import { listClients } from "@/lib/data/clients";
import { getBusinessToday } from "@/lib/data/businesses";
import { requireOwner } from "@/lib/currentUser";
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

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: Promise<{
    clientType?: string;
    bracket?: string;
    dateFrom?: string;
    dateTo?: string;
    clientId?: string;
    range?: string;
  }>;
}) {
  const { clientType, bracket, dateFrom, dateTo, clientId, range } = await searchParams;
  const user = await requireOwner();
  const today = await getBusinessToday(user.businessId);
  const thresholds = { underDays: user.business.invoiceAgingUnderDays, overDays: user.business.invoiceAgingOverDays };
  const bracketLabels = invoiceAgeBracketLabels(thresholds.underDays, thresholds.overDays);

  // No explicit range picked yet — default the overview to the current month,
  // matching the dashboard's "This month's revenue" card so the two numbers
  // agree. `range=all` is the only way to get true all-time — plain absent
  // dateFrom/dateTo means "hasn't chosen", not "chose all time", so the
  // filter pills below can tell those two states apart.
  const isAllTime = range === "all";
  const hasExplicitDate = Boolean(dateFrom || dateTo);
  const defaultRange = monthBounds(today, 0);
  const effectiveFrom = isAllTime || hasExplicitDate ? dateFrom : defaultRange.from;
  const effectiveTo = isAllTime || hasExplicitDate ? dateTo : defaultRange.to;
  const revenueFilters = { dateFrom: effectiveFrom, dateTo: effectiveTo, clientId };

  const [
    outstandingInvoices,
    summary,
    trend,
    byWorkType,
    split,
    reportRows,
    allClients,
  ] = await Promise.all([
    listOutstandingInvoices(
      user.businessId,
      { clientType: clientType as ClientType | undefined, bracket: bracket as InvoiceAgeBracket | undefined },
      thresholds,
      today
    ),
    getRevenueSummary(user.businessId, revenueFilters),
    getRevenueTrend(user.businessId, today, 12, clientId),
    getRevenueByWorkType(user.businessId, revenueFilters),
    getRecurringVsProjectSplit(user.businessId, revenueFilters),
    listInvoicesForReport(user.businessId, today, revenueFilters),
    listClients(user.businessId),
  ]);

  const totalOutstanding = outstandingInvoices.reduce((sum, i) => sum + Number(i.amount), 0);
  const exportParams = new URLSearchParams();
  if (clientId) exportParams.set("clientId", clientId);
  if (dateFrom) exportParams.set("dateFrom", dateFrom);
  if (dateTo) exportParams.set("dateTo", dateTo);
  const exportQs = exportParams.toString();

  return (
    <div>
      <PageHeader
        icon={Receipt}
        tone="burnt"
        eyebrow="Invoicing"
        title="Revenue Tracking"
        description="How much you're billing, collecting, and still owed — by client and by type of work."
      />

      <RevenueFilters dateFrom={effectiveFrom} dateTo={effectiveTo} clientId={clientId} clients={allClients} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card tone="burnt" variant="solid" className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-600">Total revenue</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-navy-900 tabular-nums">
            {formatCurrency(summary.totalBilled)}
          </p>
          <p className="mt-0.5 text-xs text-navy-500">Everything invoiced in this range</p>
        </Card>
        <Card tone="sage" variant="solid" className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-600">Paid</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-navy-900 tabular-nums">{formatCurrency(summary.paid)}</p>
          <p className="mt-0.5 text-xs text-navy-500">Collected revenue</p>
        </Card>
        <Card tone="gold" variant="solid" className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-600">Unpaid</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-navy-900 tabular-nums">
            {formatCurrency(summary.unpaid)}
          </p>
          <p className="mt-0.5 text-xs text-navy-500">Sent but not yet collected</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 lg:col-span-2">
          <PanelHeading icon={TrendingUp} tone="slate" title="Revenue trend" />
          <RevenueTrendChart data={trend.map((t) => ({ label: t.label.split(" ")[0], value: t.paid }))} />
        </Card>
        <Card className="p-6">
          <PanelHeading icon={Wallet} tone="slate" title="Recurring vs. project" />
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-navy-700">Recurring</p>
                <p className="text-sm font-medium text-navy-900 tabular-nums">{formatCurrency(split.recurring)}</p>
              </div>
              <div className="h-2 rounded-full bg-navy-100 overflow-hidden">
                <div
                  className="h-full bg-navy-700"
                  style={{
                    width: `${split.recurring + split.project === 0 ? 0 : (split.recurring / (split.recurring + split.project)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-navy-700">Project</p>
                <p className="text-sm font-medium text-navy-900 tabular-nums">{formatCurrency(split.project)}</p>
              </div>
              <div className="h-2 rounded-full bg-navy-100 overflow-hidden">
                <div
                  className="h-full bg-burnt-500"
                  style={{
                    width: `${split.recurring + split.project === 0 ? 0 : (split.project / (split.recurring + split.project)) * 100}%`,
                  }}
                />
              </div>
            </div>
            {byWorkType.length > 0 && (
              <div className="pt-2 border-t border-navy-100">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-navy-400">By type of work</p>
                <ul className="space-y-1.5">
                  {byWorkType.slice(0, 6).map((w) => (
                    <li key={w.workTypeName} className="flex items-center justify-between text-sm">
                      <span className="text-navy-600 truncate pr-2">{w.workTypeName}</span>
                      <span className="shrink-0 font-medium text-navy-900 tabular-nums">{formatCurrency(w.paid)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-medium text-navy-900">Invoices in this range</h2>
        <div className="flex items-center gap-2">
          <a
            href={`/api/reports/invoices/pdf${exportQs ? `?${exportQs}` : ""}`}
            className="flex items-center gap-1.5 rounded-lg border border-navy-200 px-3 py-1.5 text-sm font-medium text-navy-600 transition-colors hover:border-navy-400 hover:bg-navy-100/50"
          >
            <FileText size={15} /> PDF report
          </a>
          <a
            href={`/api/reports/invoices/csv${exportQs ? `?${exportQs}` : ""}`}
            className="flex items-center gap-1.5 rounded-lg border border-navy-200 px-3 py-1.5 text-sm font-medium text-navy-600 transition-colors hover:border-navy-400 hover:bg-navy-100/50"
          >
            <Download size={15} /> CSV
          </a>
        </div>
      </div>

      {reportRows.length === 0 ? (
        <EmptyState title="No invoices in this range" description="Adjust the date range or client filter above." />
      ) : (
        <div className="space-y-3 mb-10">
          {reportRows.map((inv) => {
            const days = inv.daysOutstanding;
            const rowBracket = invoiceAgeBracket(days, thresholds.underDays, thresholds.overDays);
            return (
              <div
                key={inv.id}
                className="flex flex-col gap-3 rounded-2xl bg-white px-5 py-4 shadow-[0_1px_2px_rgba(16,29,51,0.04),0_8px_24px_-16px_rgba(16,29,51,0.15)] sm:flex-row sm:items-center"
              >
                <div className="flex flex-1 items-start gap-3.5 min-w-0">
                  <AvatarChip name={inv.clientName} color={inv.clientColor} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-heading text-base font-medium text-navy-900">{inv.clientName}</p>
                      <Badge tone={inv.clientType === "PROJECT" ? "navy" : "slate"}>{CLIENT_TYPE_LABELS[inv.clientType]}</Badge>
                      <InvoiceStatusBadge status={inv.status} />
                      {inv.workTypeName && <Badge tone="burnt">{inv.workTypeName}</Badge>}
                    </div>
                    <p className="text-sm text-navy-600">{inv.label}</p>
                    <p className="mt-0.5 text-xs text-navy-400">
                      {inv.invoicedDate && <>Invoiced {formatDate(inv.invoicedDate)}</>}
                      {inv.status === "PAID" && inv.paidDate && <> · Paid {formatDate(inv.paidDate)}</>}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pl-[52px] sm:flex-nowrap sm:pl-0">
                  <div className="shrink-0 sm:w-28 sm:text-right">
                    <p className="font-heading text-lg text-navy-900">{formatCurrency(inv.amount)}</p>
                  </div>
                  {inv.status === "INVOICED" && (
                    <>
                      <div className="shrink-0 sm:w-32 sm:text-right">
                        <p className={cn("text-sm font-medium", DAYS_OUTSTANDING_TEXT_TONE[rowBracket])}>
                          {days} {days === 1 ? "day" : "days"} out
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
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mb-6 border-t border-navy-100 pt-8">
        <PanelHeading icon={FileStack} tone="slate" title="Outstanding invoices" />
        <p className="mb-4 -mt-2 text-sm text-navy-500">
          Sent-but-unpaid invoices, sorted by how long they&apos;ve been outstanding.
        </p>
      </div>

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
        <Card tone="slate" variant="solid" className="p-5 flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-white/80 text-slate-600 shadow-sm">
            <FileStack size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-2xl font-semibold text-navy-900 tabular-nums leading-tight">
              {outstandingInvoices.length}
            </p>
            <p className="text-xs font-semibold text-navy-600">Invoices shown</p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-slate-600 shadow-sm">
            <ChevronRight size={16} />
          </div>
        </Card>
      </div>

      <InvoiceAgingFilterBar clientType={clientType} bracket={bracket} bracketLabels={bracketLabels} />

      {outstandingInvoices.length === 0 ? (
        <EmptyState title="Nothing outstanding" description="No sent-but-unpaid invoices match this filter." />
      ) : (
        <>
          <div className="hidden px-5 pb-2 sm:flex sm:items-center sm:gap-3">
            <p className="flex-1 text-xs font-medium uppercase tracking-wide text-navy-400">Client / Invoice</p>
            <p className="w-28 shrink-0 text-right text-xs font-medium uppercase tracking-wide text-navy-400">Amount</p>
            <p className="w-36 shrink-0 text-right text-xs font-medium uppercase tracking-wide text-navy-400">
              Days outstanding
            </p>
            <span className="w-[104px] shrink-0" />
          </div>
          <div className="space-y-3">
            {outstandingInvoices.map((inv) => {
              const outstandingBracket = invoiceAgeBracket(inv.daysOutstanding, thresholds.underDays, thresholds.overDays);
              return (
                <div
                  key={inv.id}
                  className="flex flex-col gap-3 rounded-2xl bg-white px-5 py-4 shadow-[0_1px_2px_rgba(16,29,51,0.04),0_8px_24px_-16px_rgba(16,29,51,0.15)] sm:flex-row sm:items-center"
                >
                  <div className="flex flex-1 items-start gap-3.5 min-w-0">
                    <AvatarChip name={inv.clientName} color={inv.clientColor} />
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
                        <InvoiceAgeBracketBadge bracket={outstandingBracket} label={bracketLabels[outstandingBracket]} />
                      </div>
                      <p className="text-sm text-navy-600">{inv.label}</p>
                      <p className="mt-0.5 text-xs text-navy-400">Invoiced {formatDate(inv.invoicedDate)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pl-[52px] sm:flex-nowrap sm:pl-0">
                    <div className="shrink-0 sm:w-28 sm:text-right">
                      <p className="font-heading text-lg text-navy-900">{formatCurrency(inv.amount)}</p>
                    </div>
                    <div className="shrink-0 sm:w-36 sm:text-right">
                      <p className={cn("text-sm font-medium", DAYS_OUTSTANDING_TEXT_TONE[outstandingBracket])}>
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
