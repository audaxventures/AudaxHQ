import { sql } from "@/lib/db";
import { monthName } from "@/lib/format";
import type { ClientType, EntityColor, InvoiceStatus } from "@/lib/types";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * The calendar-month bounds N months back from `today` (0 = the month
 * `today` is in, 1 = last month, ...). Pure string/date-part arithmetic on
 * an already business-local "today" — no timezone conversion happens here,
 * matching ensureCurrentMonthRecurringInvoice's date-math convention.
 */
export function monthBounds(today: string, monthsAgo = 0): { from: string; to: string; label: string } {
  const [y, m] = today.split("-").map(Number);
  const totalMonths = y * 12 + (m - 1) - monthsAgo;
  const year = Math.floor(totalMonths / 12);
  const month = (totalMonths % 12) + 1;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    from: `${year}-${pad(month)}-01`,
    to: `${year}-${pad(month)}-${pad(lastDay)}`,
    label: `${monthName(month)} ${year}`,
  };
}

export interface RevenueFilters {
  dateFrom?: string;
  dateTo?: string;
  clientId?: string;
}

export interface RevenueSummary {
  /** paid + unpaid — everything invoiced (sent) within the range, regardless of collection status. */
  totalBilled: number;
  /** Invoiced within range and marked paid — the actually-recognized revenue for the period. */
  paid: number;
  /** Invoiced within range but not yet marked paid. */
  unpaid: number;
}

/**
 * Revenue is always attributed by `invoiced_date`, never `created_at` or
 * `paid_date` — a client's April invoice paid in May still counts as April
 * revenue. `NOT_INVOICED` drafts are excluded entirely (they're not real
 * revenue yet, sent or otherwise).
 */
export async function getRevenueSummary(businessId: string, filters: RevenueFilters = {}): Promise<RevenueSummary> {
  const rows = await sql`
    select
      coalesce(sum(i.amount) filter (where i.status = 'PAID'), 0) as paid,
      coalesce(sum(i.amount) filter (where i.status = 'INVOICED'), 0) as unpaid
    from invoices i
    where i.business_id = ${businessId}
      and i.status <> 'NOT_INVOICED'
      and (${filters.clientId ?? null}::uuid is null or i.client_id = ${filters.clientId ?? null})
      and (${filters.dateFrom ?? null}::date is null or i.invoiced_date >= ${filters.dateFrom ?? null}::date)
      and (${filters.dateTo ?? null}::date is null or i.invoiced_date <= ${filters.dateTo ?? null}::date)
  `;
  const row = rows[0] as Record<string, unknown>;
  const paid = Number(row.paid);
  const unpaid = Number(row.unpaid);
  return { totalBilled: paid + unpaid, paid, unpaid };
}

export interface RevenueTrendPoint {
  label: string;
  year: number;
  month: number;
  paid: number;
}

/** Paid revenue per calendar month, oldest first, for the last `months` months (inclusive of the current one). Always fully populated — a month with no paid invoices shows as 0 rather than being omitted, so a chart's x-axis stays evenly spaced. */
export async function getRevenueTrend(
  businessId: string,
  today: string,
  months: number,
  clientId?: string
): Promise<RevenueTrendPoint[]> {
  const bounds = monthBounds(today, months - 1);
  const rows = await sql`
    select
      extract(year from i.invoiced_date)::int as year,
      extract(month from i.invoiced_date)::int as month,
      sum(i.amount) as paid
    from invoices i
    where i.business_id = ${businessId}
      and i.status = 'PAID'
      and i.invoiced_date >= ${bounds.from}::date
      and (${clientId ?? null}::uuid is null or i.client_id = ${clientId ?? null})
    group by 1, 2
  `;
  const byKey = new Map<string, number>();
  for (const r of rows) {
    const row = r as Record<string, unknown>;
    byKey.set(`${row.year}-${row.month}`, Number(row.paid));
  }
  const points: RevenueTrendPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const b = monthBounds(today, i);
    const [year, month] = b.from.split("-").map(Number);
    points.push({ label: b.label, year, month, paid: byKey.get(`${year}-${month}`) ?? 0 });
  }
  return points;
}

export interface RevenueByWorkType {
  workTypeName: string;
  paid: number;
  unpaid: number;
}

export async function getRevenueByWorkType(businessId: string, filters: RevenueFilters = {}): Promise<RevenueByWorkType[]> {
  const rows = await sql`
    select
      coalesce(nullif(wt.name, ''), nullif(i.work_type_other, ''), 'Unspecified') as work_type_name,
      coalesce(sum(i.amount) filter (where i.status = 'PAID'), 0) as paid,
      coalesce(sum(i.amount) filter (where i.status = 'INVOICED'), 0) as unpaid
    from invoices i
    left join work_types wt on wt.id = i.work_type_id
    where i.business_id = ${businessId}
      and i.status <> 'NOT_INVOICED'
      and (${filters.clientId ?? null}::uuid is null or i.client_id = ${filters.clientId ?? null})
      and (${filters.dateFrom ?? null}::date is null or i.invoiced_date >= ${filters.dateFrom ?? null}::date)
      and (${filters.dateTo ?? null}::date is null or i.invoiced_date <= ${filters.dateTo ?? null}::date)
    group by 1
    order by paid desc
  `;
  return rows.map((r) => {
    const row = r as Record<string, unknown>;
    return { workTypeName: row.work_type_name as string, paid: Number(row.paid), unpaid: Number(row.unpaid) };
  });
}

export interface RevenueByClient {
  clientId: string;
  clientName: string;
  clientColor: EntityColor | null;
  paid: number;
  unpaid: number;
}

export async function getRevenueByClient(businessId: string, filters: Omit<RevenueFilters, "clientId"> = {}): Promise<RevenueByClient[]> {
  const rows = await sql`
    select
      c.id as client_id, c.company_name as client_name, c.color as client_color,
      coalesce(sum(i.amount) filter (where i.status = 'PAID'), 0) as paid,
      coalesce(sum(i.amount) filter (where i.status = 'INVOICED'), 0) as unpaid
    from invoices i
    join clients c on c.id = i.client_id
    where i.business_id = ${businessId}
      and i.status <> 'NOT_INVOICED'
      and (${filters.dateFrom ?? null}::date is null or i.invoiced_date >= ${filters.dateFrom ?? null}::date)
      and (${filters.dateTo ?? null}::date is null or i.invoiced_date <= ${filters.dateTo ?? null}::date)
    group by c.id, c.company_name, c.color
    having coalesce(sum(i.amount), 0) > 0
    order by paid desc
  `;
  return rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      clientId: row.client_id as string,
      clientName: row.client_name as string,
      clientColor: row.client_color as EntityColor | null,
      paid: Number(row.paid),
      unpaid: Number(row.unpaid),
    };
  });
}

export interface RecurringVsProjectSplit {
  recurring: number;
  project: number;
}

export async function getRecurringVsProjectSplit(businessId: string, filters: RevenueFilters = {}): Promise<RecurringVsProjectSplit> {
  const rows = await sql`
    select
      coalesce(sum(i.amount) filter (where c.type = 'RECURRING' and i.status = 'PAID'), 0) as recurring,
      coalesce(sum(i.amount) filter (where c.type = 'PROJECT' and i.status = 'PAID'), 0) as project
    from invoices i
    join clients c on c.id = i.client_id
    where i.business_id = ${businessId}
      and i.status <> 'NOT_INVOICED'
      and (${filters.clientId ?? null}::uuid is null or i.client_id = ${filters.clientId ?? null})
      and (${filters.dateFrom ?? null}::date is null or i.invoiced_date >= ${filters.dateFrom ?? null}::date)
      and (${filters.dateTo ?? null}::date is null or i.invoiced_date <= ${filters.dateTo ?? null}::date)
  `;
  const row = rows[0] as Record<string, unknown>;
  return { recurring: Number(row.recurring), project: Number(row.project) };
}

export interface RevenueReportRow {
  id: string;
  clientId: string;
  clientName: string;
  clientColor: EntityColor | null;
  clientType: ClientType;
  label: string;
  description: string | null;
  amount: string;
  status: InvoiceStatus;
  invoicedDate: string | null;
  paidDate: string | null;
  workTypeName: string | null;
  daysOutstanding: number;
}

/**
 * The full invoice list backing the revenue page's table and the PDF/CSV exports — always
 * sorted newest-invoiced-first. `daysOutstanding` is computed in SQL (date - date), not in JS,
 * since the driver returns `invoiced_date` as a Date object rather than a string — mirrors
 * listOutstandingInvoices's existing days_outstanding calc in data/invoicing.ts.
 */
export async function listInvoicesForReport(businessId: string, today: string, filters: RevenueFilters = {}): Promise<RevenueReportRow[]> {
  const rows = await sql`
    select
      i.id, i.client_id, i.label, i.description, i.amount, i.status, i.invoiced_date, i.paid_date,
      c.company_name as client_name, c.color as client_color, c.type as client_type,
      coalesce(nullif(wt.name, ''), nullif(i.work_type_other, '')) as work_type_name,
      (${today}::date - coalesce(i.invoiced_date, ${today}::date))::int as days_outstanding
    from invoices i
    join clients c on c.id = i.client_id
    left join work_types wt on wt.id = i.work_type_id
    where i.business_id = ${businessId}
      and i.status <> 'NOT_INVOICED'
      and (${filters.clientId ?? null}::uuid is null or i.client_id = ${filters.clientId ?? null})
      and (${filters.dateFrom ?? null}::date is null or i.invoiced_date >= ${filters.dateFrom ?? null}::date)
      and (${filters.dateTo ?? null}::date is null or i.invoiced_date <= ${filters.dateTo ?? null}::date)
    order by i.invoiced_date desc nulls last, i.created_at desc
  `;
  return rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: row.id as string,
      clientId: row.client_id as string,
      clientName: row.client_name as string,
      clientColor: row.client_color as EntityColor | null,
      clientType: row.client_type as ClientType,
      label: row.label as string,
      description: row.description as string | null,
      amount: row.amount as string,
      status: row.status as InvoiceStatus,
      invoicedDate: row.invoiced_date as string | null,
      paidDate: row.paid_date as string | null,
      workTypeName: row.work_type_name as string | null,
      daysOutstanding: Math.max(0, Number(row.days_outstanding)),
    };
  });
}
