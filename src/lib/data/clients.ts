import { sql } from "@/lib/db";
import type {
  Client,
  ClientLink,
  ClientNote,
  ClientStatus,
  ClientTask,
  ClientType,
  ClientWithRelations,
  ProjectInvoice,
  RecurringInvoice,
} from "@/lib/types";

function mapClient(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    name: row.name as string,
    company: row.company as string | null,
    contactEmail: row.contact_email as string | null,
    contactPhone: row.contact_phone as string | null,
    type: row.type as ClientType,
    status: row.status as ClientStatus,
    rate: row.rate as string,
    startDate: row.start_date as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapTask(row: Record<string, unknown>): ClientTask {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    title: row.title as string,
    done: row.done as boolean,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
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

function mapProjectInvoice(row: Record<string, unknown>): ProjectInvoice {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    amount: row.amount as string,
    status: row.status as ProjectInvoice["status"],
    invoicedDate: row.invoiced_date as string | null,
    paidDate: row.paid_date as string | null,
  };
}

function mapRecurringInvoice(row: Record<string, unknown>): RecurringInvoice {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    periodMonth: row.period_month as number,
    periodYear: row.period_year as number,
    amount: row.amount as string,
    status: row.status as RecurringInvoice["status"],
    invoicedDate: row.invoiced_date as string | null,
    paidDate: row.paid_date as string | null,
    createdAt: row.created_at as string,
  };
}

export interface ClientFilters {
  status?: ClientStatus;
  type?: ClientType;
}

export async function listClients(filters: ClientFilters = {}): Promise<
  (Client & { projectInvoiceStatus: string | null; unpaidRecurringCount: number })[]
> {
  const rows = await sql`
    select
      c.*,
      pi.status as project_invoice_status,
      coalesce(ri.unpaid_count, 0) as unpaid_recurring_count
    from clients c
    left join project_invoices pi on pi.client_id = c.id
    left join (
      select client_id, count(*) as unpaid_count
      from recurring_invoices
      where status <> 'PAID'
      group by client_id
    ) ri on ri.client_id = c.id
    where (${filters.status ?? null}::client_status is null or c.status = ${filters.status ?? null})
      and (${filters.type ?? null}::client_type is null or c.type = ${filters.type ?? null})
    order by c.status = 'ACTIVE' desc, c.name asc
  `;
  return rows.map((row) => ({
    ...mapClient(row as Record<string, unknown>),
    projectInvoiceStatus: (row as Record<string, unknown>).project_invoice_status as
      | string
      | null,
    unpaidRecurringCount: Number((row as Record<string, unknown>).unpaid_recurring_count),
  }));
}

export async function getClient(id: string): Promise<ClientWithRelations | null> {
  const [clientRows, taskRows, noteRows, linkRows, projectInvoiceRows, recurringRows] =
    await Promise.all([
      sql`select * from clients where id = ${id}`,
      sql`select * from client_tasks where client_id = ${id} order by sort_order asc, created_at asc`,
      sql`select * from client_notes where client_id = ${id} order by created_at desc`,
      sql`select * from client_links where client_id = ${id} order by created_at asc`,
      sql`select * from project_invoices where client_id = ${id}`,
      sql`select * from recurring_invoices where client_id = ${id} order by period_year desc, period_month desc`,
    ]);

  if (clientRows.length === 0) return null;

  return {
    ...mapClient(clientRows[0] as Record<string, unknown>),
    tasks: taskRows.map((r) => mapTask(r as Record<string, unknown>)),
    notes: noteRows.map((r) => mapNote(r as Record<string, unknown>)),
    links: linkRows.map((r) => mapLink(r as Record<string, unknown>)),
    projectInvoice: projectInvoiceRows[0]
      ? mapProjectInvoice(projectInvoiceRows[0] as Record<string, unknown>)
      : null,
    recurringInvoices: recurringRows.map((r) =>
      mapRecurringInvoice(r as Record<string, unknown>)
    ),
  };
}

export interface CreateClientInput {
  name: string;
  company?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  type: ClientType;
  status: ClientStatus;
  rate: number;
  startDate?: string | null;
}

export async function createClient(input: CreateClientInput): Promise<Client> {
  const rows = await sql`
    insert into clients (name, company, contact_email, contact_phone, type, status, rate, start_date)
    values (${input.name}, ${input.company ?? null}, ${input.contactEmail ?? null}, ${input.contactPhone ?? null}, ${input.type}, ${input.status}, ${input.rate}, ${input.startDate ?? null})
    returning *
  `;
  const client = mapClient(rows[0] as Record<string, unknown>);

  if (client.type === "PROJECT") {
    await sql`
      insert into project_invoices (client_id, amount, status)
      values (${client.id}, ${input.rate}, 'NOT_INVOICED')
    `;
  } else {
    await ensureCurrentMonthRecurringInvoice(client.id, input.rate);
  }

  return client;
}

export interface UpdateClientInput {
  name: string;
  company?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  type: ClientType;
  status: ClientStatus;
  rate: number;
  startDate?: string | null;
}

export async function updateClient(id: string, input: UpdateClientInput): Promise<void> {
  await sql`
    update clients set
      name = ${input.name},
      company = ${input.company ?? null},
      contact_email = ${input.contactEmail ?? null},
      contact_phone = ${input.contactPhone ?? null},
      type = ${input.type},
      status = ${input.status},
      rate = ${input.rate},
      start_date = ${input.startDate ?? null},
      updated_at = now()
    where id = ${id}
  `;

  if (input.type === "PROJECT") {
    const existing = await sql`select id from project_invoices where client_id = ${id}`;
    if (existing.length === 0) {
      await sql`insert into project_invoices (client_id, amount, status) values (${id}, ${input.rate}, 'NOT_INVOICED')`;
    }
  } else {
    await ensureCurrentMonthRecurringInvoice(id, input.rate);
  }
}

export async function deleteClient(id: string): Promise<void> {
  await sql`delete from clients where id = ${id}`;
}

// --- Tasks ---

export async function addClientTask(clientId: string, title: string): Promise<void> {
  const rows = await sql`select coalesce(max(sort_order), -1) + 1 as next from client_tasks where client_id = ${clientId}`;
  const next = Number((rows[0] as Record<string, unknown>).next);
  await sql`insert into client_tasks (client_id, title, sort_order) values (${clientId}, ${title}, ${next})`;
}

export async function toggleClientTask(id: string, done: boolean): Promise<void> {
  await sql`update client_tasks set done = ${done} where id = ${id}`;
}

export async function deleteClientTask(id: string): Promise<void> {
  await sql`delete from client_tasks where id = ${id}`;
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

// --- Invoicing ---

export async function updateProjectInvoice(
  clientId: string,
  input: { amount: number; status: string; invoicedDate: string | null; paidDate: string | null }
): Promise<void> {
  await sql`
    update project_invoices set
      amount = ${input.amount},
      status = ${input.status},
      invoiced_date = ${input.invoicedDate},
      paid_date = ${input.paidDate}
    where client_id = ${clientId}
  `;
}

export async function ensureCurrentMonthRecurringInvoice(
  clientId: string,
  rate: number
): Promise<void> {
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();
  await sql`
    insert into recurring_invoices (client_id, period_month, period_year, amount, status)
    values (${clientId}, ${month}, ${year}, ${rate}, 'NOT_INVOICED')
    on conflict (client_id, period_year, period_month) do nothing
  `;
}

export async function updateRecurringInvoice(
  id: string,
  input: { amount: number; status: string; invoicedDate: string | null; paidDate: string | null }
): Promise<void> {
  await sql`
    update recurring_invoices set
      amount = ${input.amount},
      status = ${input.status},
      invoiced_date = ${input.invoicedDate},
      paid_date = ${input.paidDate}
    where id = ${id}
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
