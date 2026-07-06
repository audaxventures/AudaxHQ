import { sql } from "@/lib/db";
import { ensureRecurringInvoicesForAllActiveClients } from "@/lib/data/clients";
import { listHotFollowUps, type HotFollowUp } from "@/lib/data/followups";
import { getLeadPipelineSummary, type LeadPipelineSummary } from "@/lib/data/leads";
import { getToday } from "@/lib/data/profile";
import type { Client, ClientType, Task, TaskPriority, TaskStatus, TaskType } from "@/lib/types";

export interface AttentionFlag {
  type: "invoice" | "lead-follow-up";
  message: string;
  href: string;
}

export interface DashboardData {
  projectClients: Client[];
  recurringClients: Client[];
  activeClientCount: number;
  /** Recurring monthly fees plus unpaid project-invoice work across active clients. */
  projectedRevenue: number;
  hotFollowUps: HotFollowUp[];
  attentionFlags: AttentionFlag[];
  todoSnapshot: Task[];
  pipelineSummary: LeadPipelineSummary;
  /** Every to-do not yet completed, regardless of due date. */
  openTodoCount: number;
  dueTodayCount: number;
  /** "Today" in the operator's configured timezone (see src/lib/timezone.ts) — YYYY-MM-DD. */
  today: string;
}

function mapClient(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    companyName: row.company_name as string,
    contactName: row.contact_name as string | null,
    contactEmail: row.contact_email as string | null,
    contactPhone: row.contact_phone as string | null,
    type: row.type as ClientType,
    status: row.status as Client["status"],
    rate: row.rate as string,
    // Not surfaced on the dashboard (no work-type badges here), so skip the join.
    workTypeId: row.work_type_id as string | null,
    workTypeName: null,
    workTypeOther: row.work_type_other as string | null,
    startDate: row.start_date as string | null,
    budgetedHours: row.budgeted_hours !== null ? Number(row.budgeted_hours) : null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const today = await getToday();

  // Lazily create this month's recurring invoice rows for active recurring
  // clients so the dashboard/invoicing views always reflect the current month.
  await ensureRecurringInvoicesForAllActiveClients(today);

  const [
    activeRows,
    projectRemainingRows,
    hotFollowUps,
    noFollowUpLeadRows,
    staleInvoiceRows,
    todoRows,
    pipelineSummary,
    openTodoCountRows,
    dueTodayCountRows,
  ] = await Promise.all([
    sql`select * from clients where status = 'ACTIVE' order by company_name asc`,
    sql`
      select coalesce(sum(i.amount), 0) as total
      from invoices i
      join clients c on c.id = i.client_id
      where c.status = 'ACTIVE' and c.type = 'PROJECT' and i.status <> 'PAID'
    `,
    listHotFollowUps(today),
    sql`
      select l.id, l.company_name
      from leads l
      where l.status not in ('WON', 'LOST')
        and not exists (select 1 from follow_ups f where f.lead_id = l.id and f.status = 'UPCOMING')
      order by l.created_at desc
    `,
    sql`
      select c.id as client_id, c.company_name as client_name
      from invoices i
      join clients c on c.id = i.client_id
      where c.status = 'ACTIVE'
        and i.status = 'NOT_INVOICED'
        and i.period_year = extract(year from ${today}::date)
        and i.period_month = extract(month from ${today}::date)
        and extract(day from ${today}::date) > 15
    `,
    sql`
      select t.*, coalesce(array_agg(tg.name) filter (where tg.name is not null), '{}') as tags
      from todos t
      left join todo_tags tt on tt.todo_id = t.id
      left join tags tg on tg.id = tt.tag_id
      where t.status <> 'COMPLETED' and (t.due_date is null or t.due_date <= ${today}::date)
      group by t.id
      order by (t.due_date is null), t.due_date asc, t.created_at desc
    `,
    getLeadPipelineSummary(today),
    sql`select count(*)::int as count from todos where status <> 'COMPLETED'`,
    sql`select count(*)::int as count from todos where status <> 'COMPLETED' and due_date = ${today}::date`,
  ]);

  const activeClients = activeRows.map((r) => mapClient(r as Record<string, unknown>));
  const projectClients = activeClients.filter((c) => c.type === "PROJECT");
  const recurringClients = activeClients.filter((c) => c.type === "RECURRING");

  const recurringMonthlyTotal = recurringClients.reduce((sum, c) => sum + Number(c.rate), 0);
  const projectRemaining = Number((projectRemainingRows[0] as Record<string, unknown>).total);
  const projectedRevenue = recurringMonthlyTotal + projectRemaining;

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
    const r = row as Record<string, unknown>;
    attentionFlags.push({
      type: "lead-follow-up",
      message: `${r.company_name} has no follow-up scheduled`,
      href: `/leads/${r.id}`,
    });
  }

  const todoSnapshot = todoRows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: row.id as string,
      title: row.title as string,
      description: row.description as string | null,
      dueDate: row.due_date as string | null,
      status: row.status as TaskStatus,
      priority: row.priority as TaskPriority,
      type: row.type as TaskType,
      // Not surfaced on the dashboard (no type badges here), so skip the join.
      todoTypeId: row.todo_type_id as string | null,
      todoTypeName: null,
      clientId: row.client_id as string | null,
      leadId: row.lead_id as string | null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      tags: ((row.tags as string[]) ?? []).filter(Boolean).sort(),
    };
  });

  return {
    projectClients,
    recurringClients,
    activeClientCount: activeClients.length,
    projectedRevenue,
    hotFollowUps,
    attentionFlags,
    todoSnapshot,
    today,
    pipelineSummary,
    openTodoCount: Number((openTodoCountRows[0] as Record<string, unknown>).count),
    dueTodayCount: Number((dueTodayCountRows[0] as Record<string, unknown>).count),
  };
}
