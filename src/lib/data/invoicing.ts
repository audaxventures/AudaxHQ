import { sql } from "@/lib/db";
import type { ClientType, InvoiceAgeBracket } from "@/lib/types";

export interface OutstandingInvoice {
  id: string;
  clientId: string;
  clientName: string;
  clientType: ClientType;
  label: string;
  amount: string;
  invoicedDate: string | null;
  daysOutstanding: number;
}

export interface InvoiceAgingFilters {
  clientType?: ClientType;
  bracket?: InvoiceAgeBracket;
}

export async function listOutstandingInvoices(
  filters: InvoiceAgingFilters = {},
  thresholds: { underDays: number; overDays: number },
  today: string
): Promise<OutstandingInvoice[]> {
  const rows = await sql`
    select
      i.id, i.client_id, i.label, i.amount, i.invoiced_date,
      c.company_name as client_name, c.type as client_type,
      (${today}::date - coalesce(i.invoiced_date, ${today}::date))::int as days_outstanding
    from invoices i
    join clients c on c.id = i.client_id
    where i.status = 'INVOICED'
      and (${filters.clientType ?? null}::client_type is null or c.type = ${filters.clientType ?? null})
      and (
        ${filters.bracket ?? null}::text is null or
        case
          when (${today}::date - coalesce(i.invoiced_date, ${today}::date)) >= ${thresholds.overDays} then 'OVER_30'
          when (${today}::date - coalesce(i.invoiced_date, ${today}::date)) >= ${thresholds.underDays} then 'DAYS_15_30'
          else 'UNDER_15'
        end = ${filters.bracket ?? null}
      )
    order by days_outstanding desc, i.invoiced_date asc nulls last
  `;
  return rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: row.id as string,
      clientId: row.client_id as string,
      clientName: row.client_name as string,
      clientType: row.client_type as ClientType,
      label: row.label as string,
      amount: row.amount as string,
      invoicedDate: row.invoiced_date as string | null,
      daysOutstanding: Number(row.days_outstanding),
    };
  });
}

export interface InvoiceExportRow {
  id: string;
  clientName: string;
  label: string;
  amount: string;
  status: string;
  invoicedDate: string | null;
  paidDate: string | null;
  periodMonth: number | null;
  periodYear: number | null;
}

/** All invoices regardless of status, for the Settings → Data Export CSV. */
export async function listAllInvoicesForExport(): Promise<InvoiceExportRow[]> {
  const rows = await sql`
    select i.*, c.company_name as client_name
    from invoices i
    join clients c on c.id = i.client_id
    order by c.company_name asc, i.period_year desc nulls last, i.period_month desc nulls last, i.created_at desc
  `;
  return rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: row.id as string,
      clientName: row.client_name as string,
      label: row.label as string,
      amount: row.amount as string,
      status: row.status as string,
      invoicedDate: row.invoiced_date as string | null,
      paidDate: row.paid_date as string | null,
      periodMonth: row.period_month as number | null,
      periodYear: row.period_year as number | null,
    };
  });
}

export interface InvoiceAgingSummary {
  totalOutstanding: number;
  overdueCount: number;
}

export async function getInvoiceAgingSummary(overDays: number, today: string): Promise<InvoiceAgingSummary> {
  const rows = await sql`
    select
      coalesce(sum(i.amount), 0) as total_outstanding,
      count(*) filter (where (${today}::date - coalesce(i.invoiced_date, ${today}::date)) >= ${overDays}) as overdue_count
    from invoices i
    where i.status = 'INVOICED'
  `;
  const row = rows[0] as Record<string, unknown>;
  return {
    totalOutstanding: Number(row.total_outstanding),
    overdueCount: Number(row.overdue_count),
  };
}

export interface MonthlyRevenueComparison {
  thisMonth: number;
  lastMonth: number;
}

/** Paid-invoice revenue for the current calendar month vs the prior one, for the dashboard. */
export async function getMonthlyRevenueComparison(today: string): Promise<MonthlyRevenueComparison> {
  const thisMonthStart = `${today.slice(0, 7)}-01`;
  const rows = await sql`
    select
      coalesce(sum(amount) filter (where paid_date >= ${thisMonthStart}::date), 0) as this_month,
      coalesce(sum(amount) filter (
        where paid_date >= ${thisMonthStart}::date - interval '1 month' and paid_date < ${thisMonthStart}::date
      ), 0) as last_month
    from invoices
    where status = 'PAID'
  `;
  const row = rows[0] as Record<string, unknown>;
  return {
    thisMonth: Number(row.this_month),
    lastMonth: Number(row.last_month),
  };
}
