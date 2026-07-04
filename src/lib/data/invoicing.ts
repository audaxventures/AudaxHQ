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
  filters: InvoiceAgingFilters = {}
): Promise<OutstandingInvoice[]> {
  const rows = await sql`
    select
      i.id, i.client_id, i.label, i.amount, i.invoiced_date,
      c.company_name as client_name, c.type as client_type,
      (current_date - coalesce(i.invoiced_date, current_date))::int as days_outstanding
    from invoices i
    join clients c on c.id = i.client_id
    where i.status = 'INVOICED'
      and (${filters.clientType ?? null}::client_type is null or c.type = ${filters.clientType ?? null})
      and (
        ${filters.bracket ?? null}::text is null or
        case
          when (current_date - coalesce(i.invoiced_date, current_date)) >= 30 then 'OVER_30'
          when (current_date - coalesce(i.invoiced_date, current_date)) >= 15 then 'DAYS_15_30'
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

export interface InvoiceAgingSummary {
  totalOutstanding: number;
  overdueCount: number;
}

export async function getInvoiceAgingSummary(): Promise<InvoiceAgingSummary> {
  const rows = await sql`
    select
      coalesce(sum(i.amount), 0) as total_outstanding,
      count(*) filter (where (current_date - coalesce(i.invoiced_date, current_date)) >= 30) as overdue_count
    from invoices i
    where i.status = 'INVOICED'
  `;
  const row = rows[0] as Record<string, unknown>;
  return {
    totalOutstanding: Number(row.total_outstanding),
    overdueCount: Number(row.overdue_count),
  };
}
