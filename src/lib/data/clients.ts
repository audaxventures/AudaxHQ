import { sql } from "@/lib/db";
import { monthName } from "@/lib/format";
import { listTasks } from "@/lib/data/todos";
import type {
  Client,
  ClientLink,
  ClientNote,
  ClientStatus,
  ClientType,
  ClientWithRelations,
  Invoice,
  InvoiceStatus,
} from "@/lib/types";
import { listFollowUpsForClient } from "@/lib/data/followups";
import { listMeetingNotes } from "@/lib/data/meetingnotes";
import { listDocuments } from "@/lib/data/documents";

function mapClient(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    companyName: row.company_name as string,
    contactName: row.contact_name as string | null,
    contactEmail: row.contact_email as string | null,
    contactPhone: row.contact_phone as string | null,
    type: row.type as ClientType,
    status: row.status as ClientStatus,
    rate: row.rate as string,
    workTypeId: row.work_type_id as string | null,
    workTypeName: (row.work_type_name as string | null) ?? null,
    workTypeOther: row.work_type_other as string | null,
    startDate: row.start_date as string | null,
    budgetedHours: row.budgeted_hours !== null ? Number(row.budgeted_hours) : null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapNote(row: Record<string, unknown>): ClientNote {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    body: row.body as string,
    createdAt: row.created_at as string,
  };
}

function mapLink(row: Record<string, unknown>): ClientLink {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    label: row.label as string,
    url: row.url as string,
  };
}

function mapInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    label: row.label as string,
    amount: row.amount as string,
    status: row.status as InvoiceStatus,
    invoicedDate: row.invoiced_date as string | null,
    paidDate: row.paid_date as string | null,
    periodMonth: row.period_month as number | null,
    periodYear: row.period_year as number | null,
    createdAt: row.created_at as string,
  };
}

export interface ClientFilters {
  status?: ClientStatus;
  type?: ClientType;
}

export async function listClients(filters: ClientFilters = {}): Promise<
  (Client & { unpaidInvoiceCount: number; invoiceCount: number })[]
> {
  const rows = await sql`
    select
      c.*,
      wt.name as work_type_name,
      coalesce(inv.unpaid_count, 0) as unpaid_invoice_count,
      coalesce(inv.total_count, 0) as invoice_count
    from clients c
    left join work_types wt on wt.id = c.work_type_id
    left join (
      select
        client_id,
        count(*) filter (where status <> 'PAID') as unpaid_count,
        count(*) as total_count
      from invoices
      group by client_id
    ) inv on inv.client_id = c.id
    where (${filters.status ?? null}::client_status is null or c.status = ${filters.status ?? null})
      and (${filters.type ?? null}::client_type is null or c.type = ${filters.type ?? null})
    order by c.status = 'ACTIVE' desc, c.company_name asc
  `;
  return rows.map((row) => ({
    ...mapClient(row as Record<string, unknown>),
    unpaidInvoiceCount: Number((row as Record<string, unknown>).unpaid_invoice_count),
    invoiceCount: Number((row as Record<string, unknown>).invoice_count),
  }));
}

export async function getClient(id: string): Promise<ClientWithRelations | null> {
  const [clientRows, noteRows, linkRows, invoiceRows, tasks, followUps, meetingNotes, documents] =
    await Promise.all([
      sql`select c.*, wt.name as work_type_name from clients c left join work_types wt on wt.id = c.work_type_id where c.id = ${id}`,
      sql`select * from client_notes where client_id = ${id} order by created_at desc`,
      sql`select * from client_links where client_id = ${id} order by created_at asc`,
      sql`select * from invoices where client_id = ${id} order by period_year desc nulls last, period_month desc nulls last, created_at desc`,
      listTasks({ clientId: id }),
      listFollowUpsForClient(id),
      listMeetingNotes({ clientId: id }),
      listDocuments(id),
    ]);

  if (clientRows.length === 0) return null;

  return {
    ...mapClient(clientRows[0] as Record<string, unknown>),
    notes: noteRows.map((r) => mapNote(r as Record<string, unknown>)),
    links: linkRows.map((r) => mapLink(r as Record<string, unknown>)),
    invoices: invoiceRows.map((r) => mapInvoice(r as Record<string, unknown>)),
    tasks,
    followUps,
    meetingNotes,
    documents,
  };
}

export interface ClientInput {
  companyName: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  type: ClientType;
  status: ClientStatus;
  rate: number;
  workTypeId?: string | null;
  workTypeOther?: string | null;
  startDate?: string | null;
  budgetedHours?: number | null;
}

export async function createClient(input: ClientInput): Promise<Client> {
  const rows = await sql`
    insert into clients (company_name, contact_name, contact_email, contact_phone, type, status, rate, work_type_id, work_type_other, start_date, budgeted_hours)
    values (
      ${input.companyName}, ${input.contactName ?? null}, ${input.contactEmail ?? null}, ${input.contactPhone ?? null},
      ${input.type}, ${input.status}, ${input.rate}, ${input.workTypeId ?? null}, ${input.workTypeOther ?? null}, ${input.startDate ?? null},
      ${input.budgetedHours ?? null}
    )
    returning *
  `;
  const client = mapClient(rows[0] as Record<string, unknown>);

  if (client.type === "RECURRING") {
    await ensureCurrentMonthRecurringInvoice(client.id, input.rate);
  }

  return client;
}

export async function updateClient(id: string, input: ClientInput): Promise<void> {
  await sql`
    update clients set
      company_name = ${input.companyName},
      contact_name = ${input.contactName ?? null},
      contact_email = ${input.contactEmail ?? null},
      contact_phone = ${input.contactPhone ?? null},
      type = ${input.type},
      status = ${input.status},
      rate = ${input.rate},
      work_type_id = ${input.workTypeId ?? null},
      work_type_other = ${input.workTypeOther ?? null},
      start_date = ${input.startDate ?? null},
      budgeted_hours = ${input.budgetedHours ?? null},
      updated_at = now()
    where id = ${id}
  `;

  if (input.type === "RECURRING") {
    await ensureCurrentMonthRecurringInvoice(id, input.rate);
  }
}

export async function setClientStatus(id: string, status: ClientStatus): Promise<void> {
  await sql`update clients set status = ${status}, updated_at = now() where id = ${id}`;
}

// --- Notes ---

export async function addClientNote(clientId: string, body: string): Promise<void> {
  await sql`insert into client_notes (client_id, body) values (${clientId}, ${body})`;
}

// --- Links ---

export async function addClientLink(
  clientId: string,
  label: string,
  url: string
): Promise<void> {
  await sql`insert into client_links (client_id, label, url) values (${clientId}, ${label}, ${url})`;
}

export async function deleteClientLink(id: string): Promise<void> {
  await sql`delete from client_links where id = ${id}`;
}

// --- Invoices ---

export interface InvoiceInput {
  label: string;
  amount: number;
  status: InvoiceStatus;
  invoicedDate: string | null;
  paidDate: string | null;
}

export async function addInvoice(clientId: string, input: InvoiceInput): Promise<void> {
  await sql`
    insert into invoices (client_id, label, amount, status, invoiced_date, paid_date)
    values (${clientId}, ${input.label}, ${input.amount}, ${input.status}, ${input.invoicedDate}, ${input.paidDate})
  `;
}

export async function updateInvoice(id: string, input: InvoiceInput): Promise<void> {
  await sql`
    update invoices set
      label = ${input.label},
      amount = ${input.amount},
      status = ${input.status},
      invoiced_date = ${input.invoicedDate},
      paid_date = ${input.paidDate}
    where id = ${id}
  `;
}

export async function deleteInvoice(id: string): Promise<void> {
  await sql`delete from invoices where id = ${id}`;
}

export async function markInvoicePaid(id: string): Promise<void> {
  await sql`
    update invoices set status = 'PAID', paid_date = coalesce(paid_date, current_date)
    where id = ${id}
  `;
}

export async function ensureCurrentMonthRecurringInvoice(
  clientId: string,
  rate: number
): Promise<void> {
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();
  const label = `${monthName(month)} ${year}`;
  await sql`
    insert into invoices (client_id, label, amount, status, period_month, period_year)
    values (${clientId}, ${label}, ${rate}, 'NOT_INVOICED', ${month}, ${year})
    on conflict (client_id, period_year, period_month) where period_month is not null do nothing
  `;
}

export async function ensureRecurringInvoicesForAllActiveClients(): Promise<void> {
  const clients = await sql`
    select id, rate from clients where type = 'RECURRING' and status = 'ACTIVE'
  `;
  await Promise.all(
    clients.map((c) =>
      ensureCurrentMonthRecurringInvoice(
        (c as Record<string, unknown>).id as string,
        Number((c as Record<string, unknown>).rate)
      )
    )
  );
}
