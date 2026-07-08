import { sql } from "@/lib/db";
import { ensureRecurringInvoicesForAllActiveClients } from "@/lib/data/clients";
import { listHotFollowUps, type HotFollowUp } from "@/lib/data/followups";
import { getLeadPipelineSummary, type LeadPipelineSummary } from "@/lib/data/leads";
import { getBusinessToday } from "@/lib/data/businesses";
import type { Client, ClientType, Task, TaskPriority, TaskStatus, TaskType } from "@/lib/types";

export interface AttentionFlag {
  type: "invoice" | "lead-follow-up";
  message: string;
  href: string;
}

export interface DashboardData {
  projectClients: Client[];
  recurringClients: Client[];
  /** Recurring monthly fees plus unpaid project-invoice work across active clients. Null for team members — client billing is hidden from them entirely. */
  projectedRevenue: number | null;
  hotFollowUps: HotFollowUp[];
  attentionFlags: AttentionFlag[];
  /** Up to 5 open to-dos, soonest due date first (regardless of overdue/today/future). */
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
    color: row.color as Client["color"],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * `accessibleClientIds`: null for the owner (no restriction); a team member's
 * exact client-access list otherwise. `isOwner` additionally gates
 * client-billing figures (revenue, stale-invoice flags), which stay hidden
 * from team members regardless of which clients they can see.
 * `selfAssigneeId`: the caller's own to-do board identity — null for the
 * owner, a team member's id otherwise — so the snapshot/counts only ever
 * reflect the viewer's own to-dos, never a colleague's.
 */
export async function getDashboardData(
  businessId: string,
  isOwner: boolean,
  accessibleClientIds: string[] | null,
  selfAssigneeId: string | null
): Promise<DashboardData> {
  const today = await getBusinessToday(businessId);

  // Lazily create this month's recurring invoice rows for active recurring
  // clients so the dashboard/invoicing views always reflect the current month.
  await ensureRecurringInvoicesForAllActiveClients(businessId, today);

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
    sql`
      select * from clients
      where business_id = ${businessId} and status = 'ACTIVE'
        and (${accessibleClientIds ?? null}::uuid[] is null or id = any(${accessibleClientIds ?? null}::uuid[]))
      order by company_name asc
    `,
    isOwner
      ? sql`
          select coalesce(sum(i.amount), 0) as total
          from invoices i
          join clients c on c.id = i.client_id
          where i.business_id = ${businessId} and c.status = 'ACTIVE' and c.type = 'PROJECT' and i.status <> 'PAID'
        `
      : Promise.resolve([{ total: 0 }]),
    listHotFollowUps(businessId, today, accessibleClientIds),
    sql`
      select l.id, l.company_name
      from leads l
      where l.business_id = ${businessId}
        and l.status not in ('WON', 'LOST')
        and not exists (select 1 from follow_ups f where f.lead_id = l.id and f.status = 'UPCOMING')
      order by l.created_at desc
    `,
    isOwner
      ? sql`
          select c.id as client_id, c.company_name as client_name
          from invoices i
          join clients c on c.id = i.client_id
          where i.business_id = ${businessId} and c.status = 'ACTIVE'
            and i.status = 'NOT_INVOICED'
            and i.period_year = extract(year from ${today}::date)
            and i.period_month = extract(month from ${today}::date)
            and extract(day from ${today}::date) > 15
        `
      : Promise.resolve([]),
    sql`
      select t.*, coalesce(array_agg(tg.name) filter (where tg.name is not null), '{}') as tags,
        creator_tm.name as created_by_name
      from todos t
      left join todo_tags tt on tt.todo_id = t.id
      left join tags tg on tg.id = tt.tag_id
      left join team_members creator_tm on creator_tm.id = t.created_by_team_member_id
      where t.business_id = ${businessId}
        and t.status <> 'COMPLETED'
        and t.assigned_to_team_member_id is not distinct from ${selfAssigneeId}::uuid
      group by t.id, creator_tm.name
      order by (t.due_date is null), t.due_date asc, t.created_at desc
      limit 5
    `,
    getLeadPipelineSummary(businessId, today),
    sql`
      select count(*)::int as count from todos
      where business_id = ${businessId}
        and status <> 'COMPLETED' and assigned_to_team_member_id is not distinct from ${selfAssigneeId}::uuid
    `,
    sql`
      select count(*)::int as count from todos
      where business_id = ${businessId}
        and status <> 'COMPLETED' and due_date = ${today}::date
        and assigned_to_team_member_id is not distinct from ${selfAssigneeId}::uuid
    `,
  ]);

  const activeClients = activeRows.map((r) => mapClient(r as Record<string, unknown>));
  const projectClients = activeClients.filter((c) => c.type === "PROJECT");
  const recurringClients = activeClients.filter((c) => c.type === "RECURRING");

  let projectedRevenue: number | null = null;
  if (isOwner) {
    const recurringMonthlyTotal = recurringClients.reduce((sum, c) => sum + Number(c.rate), 0);
    const projectRemaining = Number((projectRemainingRows[0] as Record<string, unknown>).total);
    projectedRevenue = recurringMonthlyTotal + projectRemaining;
  }

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

  const todoSnapshot: Task[] = todoRows.map((r) => {
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
      assignedToTeamMemberId: row.assigned_to_team_member_id as string | null,
      createdByTeamMemberId: row.created_by_team_member_id as string | null,
      createdByName: (row.created_by_name as string | null) ?? "Owner",
    };
  });

  // ClientsPanel is a Client Component — its props (including `rate`) are
  // serialized to the browser regardless of whether the UI renders the
  // figure, so strip it here rather than trusting the component alone.
  const sanitizeClientRate = (c: Client): Client => (isOwner ? c : { ...c, rate: "0" });

  return {
    projectClients: projectClients.map(sanitizeClientRate),
    recurringClients: recurringClients.map(sanitizeClientRate),
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
