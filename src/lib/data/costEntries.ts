import { sql } from "@/lib/db";
import type { CategoryBreakdown, CostEntry, CostRollup, CostSummary, FixedCostCategory } from "@/lib/types";

function mapCostEntry(row: Record<string, unknown>): CostEntry {
  return {
    id: row.id as string,
    entryType: row.entry_type as CostEntry["entryType"],
    clientId: row.client_id as string | null,
    leadId: row.lead_id as string | null,
    ownerName: row.owner_name as string,
    date: row.date as string,
    description: row.description as string | null,
    hours: row.hours !== null ? Number(row.hours) : null,
    rate: row.rate !== null ? Number(row.rate) : null,
    billable: row.billable as boolean | null,
    teamMemberName: row.team_member_name as string | null,
    workCategoryId: row.work_category_id as string | null,
    workCategoryName: row.work_category_name as string | null,
    category: row.category as FixedCostCategory | null,
    amount: Number(row.amount),
    createdAt: row.created_at as string,
  };
}

export interface CostEntryFilters {
  clientId?: string;
  leadId?: string;
  teamMemberId?: string;
  workCategoryId?: string;
  billable?: boolean;
  dateFrom?: string;
  dateTo?: string;
  /** Team-member-role scoping: when set, only that team member's own time entries are returned — fixed costs are excluded entirely (they're business-level expenses with no team-member concept). Undefined/null = no restriction (owner view). */
  restrictToTeamMemberId?: string | null;
  /** Team-member-role scoping: when set (a non-null array), only time entries with no client (lead-owned) or whose client is in this list are returned. Undefined/null = no restriction. */
  restrictToClientIds?: string[] | null;
}

/**
 * Combined log of time entries and fixed costs, newest first. The
 * team-member, work-category, and billable filters only apply to time
 * entries (fixed costs have none of those concepts), so setting any of
 * them narrows the fixed-cost branch to nothing rather than ignoring
 * the filter. The same is true of restrictToTeamMemberId (team-member-role
 * scoping) — fixed costs are always excluded once that's set.
 */
export async function listCostEntries(filters: CostEntryFilters = {}): Promise<CostEntry[]> {
  const rows = await sql`
    select * from (
      select
        te.id, 'TIME' as entry_type, te.client_id, te.lead_id,
        coalesce(c.company_name, l.company_name) as owner_name,
        te.date, te.description, te.hours, te.rate, te.billable,
        tm.name as team_member_name, te.category_id as work_category_id, wc.name as work_category_name,
        null::text as category,
        (te.hours * te.rate) as amount, te.created_at
      from time_entries te
      join team_members tm on tm.id = te.team_member_id
      left join work_categories wc on wc.id = te.category_id
      left join clients c on c.id = te.client_id
      left join leads l on l.id = te.lead_id
      where (${filters.clientId ?? null}::uuid is null or te.client_id = ${filters.clientId ?? null})
        and (${filters.leadId ?? null}::uuid is null or te.lead_id = ${filters.leadId ?? null})
        and (${filters.teamMemberId ?? null}::uuid is null or te.team_member_id = ${filters.teamMemberId ?? null})
        and (${filters.workCategoryId ?? null}::uuid is null or te.category_id = ${filters.workCategoryId ?? null})
        and (${filters.billable ?? null}::boolean is null or te.billable = ${filters.billable ?? null})
        and (${filters.dateFrom ?? null}::date is null or te.date >= ${filters.dateFrom ?? null})
        and (${filters.dateTo ?? null}::date is null or te.date <= ${filters.dateTo ?? null})
        and (${filters.restrictToTeamMemberId ?? null}::uuid is null or te.team_member_id = ${filters.restrictToTeamMemberId ?? null})
        and (
          ${filters.restrictToClientIds ?? null}::uuid[] is null
          or te.client_id is null
          or te.client_id = any(${filters.restrictToClientIds ?? null}::uuid[])
        )

      union all

      select
        fc.id, 'FIXED_COST' as entry_type, fc.client_id, fc.lead_id,
        coalesce(c.company_name, l.company_name) as owner_name,
        fc.date, fc.description, null::numeric as hours, null::numeric as rate, null::boolean as billable,
        null::text as team_member_name, null::uuid as work_category_id, null::text as work_category_name,
        fc.category,
        fc.amount, fc.created_at
      from fixed_costs fc
      left join clients c on c.id = fc.client_id
      left join leads l on l.id = fc.lead_id
      where (${filters.clientId ?? null}::uuid is null or fc.client_id = ${filters.clientId ?? null})
        and (${filters.leadId ?? null}::uuid is null or fc.lead_id = ${filters.leadId ?? null})
        and ${filters.teamMemberId ?? null}::uuid is null
        and ${filters.workCategoryId ?? null}::uuid is null
        and ${filters.billable ?? null}::boolean is null
        and (${filters.dateFrom ?? null}::date is null or fc.date >= ${filters.dateFrom ?? null})
        and (${filters.dateTo ?? null}::date is null or fc.date <= ${filters.dateTo ?? null})
        and ${filters.restrictToTeamMemberId ?? null}::uuid is null
    ) combined
    order by date desc, created_at desc
  `;
  return rows.map((r) => mapCostEntry(r as Record<string, unknown>));
}

export function rollupCostEntries(entries: CostEntry[]): CostRollup {
  let billableHours = 0;
  let nonBillableHours = 0;
  let variableCost = 0;
  let nonBillableCost = 0;
  let fixedCost = 0;

  for (const e of entries) {
    if (e.entryType === "TIME") {
      if (e.billable) {
        billableHours += e.hours ?? 0;
        variableCost += e.amount;
      } else {
        nonBillableHours += e.hours ?? 0;
        nonBillableCost += e.amount;
      }
    } else {
      fixedCost += e.amount;
    }
  }

  const totalHours = billableHours + nonBillableHours;
  return {
    billableHours,
    nonBillableHours,
    totalHours,
    variableCost,
    nonBillableCost,
    fixedCost,
    totalCost: variableCost + fixedCost,
  };
}

/** Per-work-category hours/cost breakdown for time entries, sorted by total hours descending. */
export function buildCategoryBreakdown(entries: CostEntry[]): CategoryBreakdown[] {
  const byCategory = new Map<string, CategoryBreakdown>();

  for (const e of entries) {
    if (e.entryType !== "TIME") continue;
    const key = e.workCategoryId ?? "uncategorized";
    const row = byCategory.get(key) ?? {
      categoryId: e.workCategoryId,
      categoryName: e.workCategoryName ?? "Uncategorized",
      billableHours: 0,
      nonBillableHours: 0,
      cost: 0,
    };
    if (e.billable) {
      row.billableHours += e.hours ?? 0;
      row.cost += e.amount;
    } else {
      row.nonBillableHours += e.hours ?? 0;
    }
    byCategory.set(key, row);
  }

  return [...byCategory.values()].sort(
    (a, b) => b.billableHours + b.nonBillableHours - (a.billableHours + a.nonBillableHours)
  );
}

export function buildCostSummary(
  entries: CostEntry[],
  totalInvoiced: number,
  budgetedHours: number | null
): CostSummary {
  const rollup = rollupCostEntries(entries);
  const profit = totalInvoiced - rollup.totalCost;
  return {
    ...rollup,
    totalInvoiced,
    profit,
    profitMarginPercent: totalInvoiced > 0 ? (profit / totalInvoiced) * 100 : null,
    effectiveHourlyRate: rollup.billableHours > 0 ? totalInvoiced / rollup.billableHours : null,
    budgetedHours,
    overBudget: budgetedHours !== null && rollup.totalHours > budgetedHours,
    categoryBreakdown: buildCategoryBreakdown(entries),
  };
}

export interface TimeEntryInput {
  clientId: string | null;
  leadId: string | null;
  teamMemberId: string;
  categoryId: string | null;
  date: string;
  hours: number;
  rate: number;
  billable: boolean;
  description: string | null;
}

export async function createTimeEntry(input: TimeEntryInput): Promise<void> {
  await sql`
    insert into time_entries (client_id, lead_id, team_member_id, category_id, date, hours, rate, billable, description)
    values (
      ${input.clientId}, ${input.leadId}, ${input.teamMemberId}, ${input.categoryId}, ${input.date},
      ${input.hours}, ${input.rate}, ${input.billable}, ${input.description}
    )
  `;
}

/** `restrictToTeamMemberId` (team-member role) makes this a silent no-op against another team member's entry, rather than trusting the caller's claimed ownership. */
export async function deleteTimeEntry(id: string, restrictToTeamMemberId?: string | null): Promise<void> {
  await sql`
    delete from time_entries
    where id = ${id}
      and (${restrictToTeamMemberId ?? null}::uuid is null or team_member_id = ${restrictToTeamMemberId ?? null})
  `;
}

export interface FixedCostInput {
  clientId: string | null;
  leadId: string | null;
  date: string;
  description: string;
  amount: number;
  category: FixedCostCategory | null;
}

export async function createFixedCost(input: FixedCostInput): Promise<void> {
  await sql`
    insert into fixed_costs (client_id, lead_id, date, description, amount, category)
    values (${input.clientId}, ${input.leadId}, ${input.date}, ${input.description}, ${input.amount}, ${input.category})
  `;
}

export async function deleteFixedCost(id: string): Promise<void> {
  await sql`delete from fixed_costs where id = ${id}`;
}
