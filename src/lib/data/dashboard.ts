import { sql } from "@/lib/db";
import { ensureRecurringInvoicesForAllActiveClients } from "@/lib/data/clients";
import type { Client, ClientType, Lead, LeadStatus, Todo } from "@/lib/types";

export interface AttentionFlag {
  type: "invoice" | "lead-follow-up";
  message: string;
  href: string;
}

export interface DashboardData {
  activeClients: Client[];
  projectClients: Client[];
  recurringClients: Client[];
  projectedRevenue: number;
  hotLeads: (Lead & { isOverdue: boolean })[];
  attentionFlags: AttentionFlag[];
  todoSnapshot: Todo[];
  overdueTodoCount: number;
}

function mapClient(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    name: row.name as string,
    company: row.company as string | null,
    contactEmail: row.contact_email as string | null,
    contactPhone: row.contact_phone as string | null,
    type: row.type as ClientType,
    status: row.status as Client["status"],
    rate: row.rate as string,
    startDate: row.start_date as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapLead(row: Record<string, unknown>): Lead {
  return {
    id: row.id as string,
    name: row.name as string,
    company: row.company as string | null,
    contactEmail: row.contact_email as string | null,
    contactPhone: row.contact_phone as string | null,
    status: row.status as LeadStatus,
    estimatedValue: row.estimated_value as string | null,
    nextFollowUpDate: row.next_follow_up_date as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    convertedClientId: row.converted_client_id as string | null,
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  // Lazily create this month's recurring invoice rows for active recurring
  // clients so the dashboard/invoicing views always reflect the current month.
  await ensureRecurringInvoicesForAllActiveClients();

  const [activeRows, projectRemainingRows, hotLeadRows, noFollowUpLeadRows, staleInvoiceRows, todoRows, overdueCountRows] =
    await Promise.all([
      sql`select * from clients where status = 'ACTIVE' order by name asc`,
      sql`
        select coalesce(sum(pi.amount), 0) as total
        from project_invoices pi
        join clients c on c.id = pi.client_id
        where c.status = 'ACTIVE' and pi.status <> 'PAID'
      `,
      sql`
        select * from leads
        where status not in ('WON', 'LOST')
          and next_follow_up_date is not null
          and next_follow_up_date <= current_date
        order by next_follow_up_date asc
      `,
      sql`
        select * from leads
        where status not in ('WON', 'LOST') and next_follow_up_date is null
        order by created_at desc
      `,
      sql`
        select c.id as client_id, c.name as client_name, ri.period_month, ri.period_year
        from recurring_invoices ri
        join clients c on c.id = ri.client_id
        where c.status = 'ACTIVE'
          and ri.status = 'NOT_INVOICED'
          and ri.period_year = extract(year from current_date)
          and ri.period_month = extract(month from current_date)
          and extract(day from current_date) > 15
      `,
      sql`
        select t.*, coalesce(array_agg(tg.name) filter (where tg.name is not null), '{}') as tags
        from todos t
        left join todo_tags tt on tt.todo_id = t.id
        left join tags tg on tg.id = tt.tag_id
        where t.status = 'OPEN' and (t.due_date is null or t.due_date <= current_date)
        group by t.id
        order by (t.due_date is null), t.due_date asc, t.created_at desc
      `,
      sql`select count(*)::int as count from todos where status = 'OPEN' and due_date < current_date`,
    ]);

  const activeClients = activeRows.map((r) => mapClient(r as Record<string, unknown>));
  const projectClients = activeClients.filter((c) => c.type === "PROJECT");
  const recurringClients = activeClients.filter((c) => c.type === "RECURRING");

  const recurringMonthlyTotal = recurringClients.reduce(
    (sum, c) => sum + Number(c.rate),
    0
  );
  const projectRemaining = Number(
    (projectRemainingRows[0] as Record<string, unknown>).total
  );
  const projectedRevenue = recurringMonthlyTotal + projectRemaining;

  const today = new Date().toISOString().slice(0, 10);
  const hotLeads = hotLeadRows.map((r) => {
    const lead = mapLead(r as Record<string, unknown>);
    return { ...lead, isOverdue: (lead.nextFollowUpDate ?? "") < today };
  });

  const attentionFlags: AttentionFlag[] = [];
  for (const row of staleInvoiceRows) {
    const r = row as Record<string, unknown>;
    attentionFlags.push({
      type: "invoice",
      message: `${r.client_name} — this month's invoice isn't marked sent yet`,
      href: `/clients/${r.client_id}`,
    });
  }
  for (const row of noFollowUpLeadRows) {
    const lead = mapLead(row as Record<string, unknown>);
    attentionFlags.push({
      type: "lead-follow-up",
      message: `${lead.name} has no follow-up date set`,
      href: `/leads/${lead.id}`,
    });
  }

  const todoSnapshot = todoRows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: row.id as string,
      title: row.title as string,
      description: row.description as string | null,
      dueDate: row.due_date as string | null,
      status: row.status as Todo["status"],
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      tags: ((row.tags as string[]) ?? []).filter(Boolean).sort(),
    };
  });

  return {
    activeClients,
    projectClients,
    recurringClients,
    projectedRevenue,
    hotLeads,
    attentionFlags,
    todoSnapshot,
    overdueTodoCount: Number(
      (overdueCountRows[0] as Record<string, unknown>).count
    ),
  };
}
