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
  EntityColor,
  Invoice,
  InvoiceStatus,
  InvoiceType,
} from "@/lib/types";
import { listFollowUpsForClient } from "@/lib/data/followups";
import { listMeetingNotes } from "@/lib/data/meetingnotes";
import { listDocumentsForClient } from "@/lib/data/documents";

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
    color: row.color as EntityColor | null,
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
    authorTeamMemberId: (row.author_team_member_id as string | null) ?? null,
    authorName: (row.author_name as string | null) ?? null,
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
    invoiceType: row.invoice_type as InvoiceType,
    hours: row.hours as string | null,
    hourlyRate: row.hourly_rate as string | null,
    description: row.description as string | null,
    status: row.status as InvoiceStatus,
    invoicedDate: row.invoiced_date as string | null,
    paidDate: row.paid_date as string | null,
    periodMonth: row.period_month as number | null,
    periodYear: row.period_year as number | null,
    workTypeId: row.work_type_id as string | null,
    workTypeName: (row.work_type_name as string | null) ?? null,
    workTypeOther: row.work_type_other as string | null,
    createdAt: row.created_at as string,
  };
}

export interface ClientFilters {
  status?: ClientStatus;
  type?: ClientType;
  limit?: number;
  offset?: number;
  /** Team-member scoping: restrict results to these client IDs. Undefined/null = no restriction (owner). */
  accessibleClientIds?: string[] | null;
}

export async function listClients(
  businessId: string,
  filters: ClientFilters = {}
): Promise<(Client & { unpaidInvoiceCount: number; invoiceCount: number })[]> {
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
      where business_id = ${businessId}
      group by client_id
    ) inv on inv.client_id = c.id
    where c.business_id = ${businessId}
      and (${filters.status ?? null}::client_status is null or c.status = ${filters.status ?? null})
      and (${filters.type ?? null}::client_type is null or c.type = ${filters.type ?? null})
      and (${filters.accessibleClientIds ?? null}::uuid[] is null or c.id = any(${filters.accessibleClientIds ?? null}::uuid[]))
    order by c.status = 'ACTIVE' desc, c.company_name asc
    limit ${filters.limit ?? null}
    offset ${filters.offset ?? 0}
  `;
  return rows.map((row) => ({
    ...mapClient(row as Record<string, unknown>),
    unpaidInvoiceCount: Number((row as Record<string, unknown>).unpaid_invoice_count),
    invoiceCount: Number((row as Record<string, unknown>).invoice_count),
  }));
}

/** Whether `clientId` belongs to `businessId` — the tenant-isolation check behind requireClientAccess, independent of any team-member access-list scoping. */
export async function clientBelongsToBusiness(clientId: string, businessId: string): Promise<boolean> {
  const rows = await sql`select 1 from clients where id = ${clientId} and business_id = ${businessId}`;
  return rows.length > 0;
}

/** Cheap single-column lookup — used as a fallback when a team member's edit form doesn't submit a rate at all (see ClientForm's hideRate). */
export async function getClientRate(id: string, businessId: string): Promise<number> {
  const rows = await sql`select rate from clients where id = ${id} and business_id = ${businessId}`;
  return rows[0] ? Number((rows[0] as Record<string, unknown>).rate) : 0;
}

export async function getClient(id: string, businessId: string): Promise<ClientWithRelations | null> {
  const [clientRows, noteRows, linkRows, invoiceRows, tasks, followUps, meetingNotes, documents] =
    await Promise.all([
      sql`
        select c.*, wt.name as work_type_name from clients c
        left join work_types wt on wt.id = c.work_type_id
        where c.id = ${id} and c.business_id = ${businessId}
      `,
      sql`
        select n.*, tm.name as author_name
        from client_notes n
        left join team_members tm on tm.id = n.author_team_member_id
        where n.client_id = ${id} and n.business_id = ${businessId}
        order by n.created_at desc
      `,
      sql`select * from client_links where client_id = ${id} and business_id = ${businessId} order by created_at asc`,
      sql`
        select i.*, wt.name as work_type_name
        from invoices i
        left join work_types wt on wt.id = i.work_type_id
        where i.client_id = ${id} and i.business_id = ${businessId}
        order by i.period_year desc nulls last, i.period_month desc nulls last, i.created_at desc
      `,
      listTasks(businessId, { clientId: id }),
      listFollowUpsForClient(id, businessId),
      listMeetingNotes(businessId, { clientId: id }),
      listDocumentsForClient(id, businessId),
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
  color?: EntityColor | null;
}

export async function createClient(businessId: string, input: ClientInput, today: string): Promise<Client> {
  const rows = await sql`
    insert into clients (business_id, company_name, contact_name, contact_email, contact_phone, type, status, rate, work_type_id, work_type_other, start_date, budgeted_hours, color)
    values (
      ${businessId}, ${input.companyName}, ${input.contactName ?? null}, ${input.contactEmail ?? null}, ${input.contactPhone ?? null},
      ${input.type}, ${input.status}, ${input.rate}, ${input.workTypeId ?? null}, ${input.workTypeOther ?? null}, ${input.startDate ?? null},
      ${input.budgetedHours ?? null}, ${input.color ?? null}
    )
    returning *
  `;
  const client = mapClient(rows[0] as Record<string, unknown>);

  if (client.type === "RECURRING") {
    await ensureCurrentMonthRecurringInvoice(businessId, client.id, input.rate, today);
  }

  return client;
}

export async function updateClient(id: string, businessId: string, input: ClientInput, today: string): Promise<void> {
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
      color = ${input.color ?? null},
      updated_at = now()
    where id = ${id} and business_id = ${businessId}
  `;

  if (input.type === "RECURRING") {
    await ensureCurrentMonthRecurringInvoice(businessId, id, input.rate, today);
  }
}

export async function setClientStatus(id: string, businessId: string, status: ClientStatus): Promise<void> {
  await sql`update clients set status = ${status}, updated_at = now() where id = ${id} and business_id = ${businessId}`;
}

export async function setClientColor(id: string, businessId: string, color: EntityColor | null): Promise<void> {
  await sql`update clients set color = ${color}, updated_at = now() where id = ${id} and business_id = ${businessId}`;
}

/**
 * Permanently erases a client and everything under it (follow-ups, meeting
 * notes, invoices, time/cost entries, documents, notes, links — all
 * cascade-deleted by their foreign keys). Only allowed once the client is
 * already archived, mirroring the equivalent "must be suspended first" guard
 * on deleteBusiness — a hard stop against deleting a client that's still in
 * active use.
 */
export async function deleteClient(id: string, businessId: string): Promise<void> {
  const rows = await sql`
    delete from clients
    where id = ${id} and business_id = ${businessId} and status = 'CHURNED'
    returning id
  `;
  if (rows.length === 0) {
    throw new Error("Archive this client before deleting it permanently.");
  }
}

// --- Notes ---

export async function addClientNote(
  clientId: string,
  businessId: string,
  body: string,
  authorTeamMemberId: string | null
): Promise<void> {
  await sql`insert into client_notes (client_id, business_id, body, author_team_member_id) values (${clientId}, ${businessId}, ${body}, ${authorTeamMemberId})`;
}

/** Cheap single-column lookup — names the client in a mention notification's message without loading the full record. */
export async function getClientCompanyName(id: string, businessId: string): Promise<string | null> {
  const rows = await sql`select company_name from clients where id = ${id} and business_id = ${businessId}`;
  return rows[0] ? ((rows[0] as Record<string, unknown>).company_name as string) : null;
}

/** Cheap lookup — used to default a new invoice's work-type fields from its client at creation time (see addInvoice in app/(app)/clients/actions.ts). */
export async function getClientWorkType(
  id: string,
  businessId: string
): Promise<{ workTypeId: string | null; workTypeOther: string | null } | null> {
  const rows = await sql`select work_type_id, work_type_other from clients where id = ${id} and business_id = ${businessId}`;
  const row = rows[0] as Record<string, unknown> | undefined;
  return row ? { workTypeId: row.work_type_id as string | null, workTypeOther: row.work_type_other as string | null } : null;
}

// --- Links ---

export async function addClientLink(
  clientId: string,
  businessId: string,
  label: string,
  url: string
): Promise<void> {
  await sql`insert into client_links (client_id, business_id, label, url) values (${clientId}, ${businessId}, ${label}, ${url})`;
}

export async function deleteClientLink(id: string, businessId: string): Promise<void> {
  await sql`delete from client_links where id = ${id} and business_id = ${businessId}`;
}

// --- Invoices ---

export interface InvoiceInput {
  label: string;
  /** For HOURLY invoices this is hours * hourlyRate, computed by the caller. */
  amount: number;
  invoiceType: InvoiceType;
  hours: number | null;
  hourlyRate: number | null;
  description: string | null;
  status: InvoiceStatus;
  invoicedDate: string | null;
  paidDate: string | null;
  /** Only read by addInvoice — see mapInvoice's field comment on why updateInvoice never touches these. */
  workTypeId?: string | null;
  workTypeOther?: string | null;
}

export async function addInvoice(clientId: string, businessId: string, input: InvoiceInput): Promise<void> {
  await sql`
    insert into invoices (client_id, business_id, label, amount, invoice_type, hours, hourly_rate, description, status, invoiced_date, paid_date, work_type_id, work_type_other)
    values (
      ${clientId}, ${businessId}, ${input.label}, ${input.amount},
      ${input.invoiceType}, ${input.hours}, ${input.hourlyRate}, ${input.description},
      ${input.status}, ${input.invoicedDate}, ${input.paidDate}, ${input.workTypeId ?? null}, ${input.workTypeOther ?? null}
    )
  `;
}

/**
 * Deliberately never touches work_type_id/work_type_other — those are set
 * once at creation (defaulted from the client's work type at that moment,
 * see addInvoice's caller in actions.ts) and stay historically accurate even
 * if the client's work type later changes. The edit form has no work-type
 * field, so there's nothing in `input` to write here anyway.
 */
export async function updateInvoice(id: string, businessId: string, input: InvoiceInput): Promise<void> {
  await sql`
    update invoices set
      label = ${input.label},
      amount = ${input.amount},
      invoice_type = ${input.invoiceType},
      hours = ${input.hours},
      hourly_rate = ${input.hourlyRate},
      description = ${input.description},
      status = ${input.status},
      invoiced_date = ${input.invoicedDate},
      paid_date = ${input.paidDate}
    where id = ${id} and business_id = ${businessId}
  `;
}

export async function deleteInvoice(id: string, businessId: string): Promise<void> {
  await sql`delete from invoices where id = ${id} and business_id = ${businessId}`;
}

export async function markInvoicePaid(id: string, businessId: string, today: string): Promise<void> {
  await sql`
    update invoices set status = 'PAID', paid_date = coalesce(paid_date, ${today}::date)
    where id = ${id} and business_id = ${businessId}
  `;
}

export async function ensureCurrentMonthRecurringInvoice(
  businessId: string,
  clientId: string,
  rate: number,
  today: string,
  workTypeId: string | null = null,
  workTypeOther: string | null = null
): Promise<void> {
  const [year, month] = today.split("-").map(Number);
  const label = `${monthName(month)} ${year}`;
  await sql`
    insert into invoices (client_id, business_id, label, amount, status, period_month, period_year, work_type_id, work_type_other)
    values (${clientId}, ${businessId}, ${label}, ${rate}, 'NOT_INVOICED', ${month}, ${year}, ${workTypeId}, ${workTypeOther})
    on conflict (client_id, period_year, period_month) where period_month is not null do nothing
  `;
}

export async function ensureRecurringInvoicesForAllActiveClients(businessId: string, today: string): Promise<void> {
  const clients = await sql`
    select id, rate, work_type_id, work_type_other from clients
    where business_id = ${businessId} and type = 'RECURRING' and status = 'ACTIVE'
  `;
  await Promise.all(
    clients.map((c) => {
      const row = c as Record<string, unknown>;
      return ensureCurrentMonthRecurringInvoice(
        businessId,
        row.id as string,
        Number(row.rate),
        today,
        row.work_type_id as string | null,
        row.work_type_other as string | null
      );
    })
  );
}
