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
    teamMemberId: row.team_member_id as string | null,
    teamMemberName: row.team_member_name as string | null,
    workCategoryId: row.work_category_id as string | null,
    workCategoryName: row.work_category_name as string | null,
    category: row.category as FixedCostCategory | null,
    amount: row.amount !== null ? Number(row.amount) : null,
    cost: Number(row.cost),
    invoiceId: row.invoice_id as string | null,
    createdAt: row.created_at as string,
  };
}

export interface CostEntryFilters {
  clientId?: string;
  leadId?: string;
  teamMemberId?: string;
  /** Only the business owner's own time entries (team_member_id is null) — mutually exclusive with teamMemberId in practice, since the owner isn't a real team_members row for this purpose. */
  ownerOnly?: boolean;
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
 *
 * `cost` (labor cost) is computed here from the logging team member's
 * default_hourly_rate — falling back to the business owner's own
 * team_members row when team_member_id is null — never from the entry's
 * own (optional, billing-only) `rate`.
 */
export async function listCostEntries(businessId: string, filters: CostEntryFilters = {}): Promise<CostEntry[]> {
  const rows = await sql`
    select * from (
      select
        te.id, 'TIME' as entry_type, te.client_id, te.lead_id,
        coalesce(c.company_name, l.company_name) as owner_name,
        te.date, te.description, te.hours, te.rate, te.billable,
        te.team_member_id, coalesce(tm.name, b.owner_name) as team_member_name, te.category_id as work_category_id, wc.name as work_category_name,
        null::text as category,
        (case when te.rate is not null then te.hours * te.rate else null end) as amount,
        (te.hours * coalesce(tm.default_hourly_rate, owner_tm.default_hourly_rate, 0)) as cost,
        te.invoice_id, te.created_at
      from time_entries te
      left join team_members tm on tm.id = te.team_member_id
      left join businesses b on b.id = te.business_id
      left join team_members owner_tm on owner_tm.id = b.owner_team_member_id
      left join work_categories wc on wc.id = te.category_id
      left join clients c on c.id = te.client_id
      left join leads l on l.id = te.lead_id
      where te.business_id = ${businessId}
        and (${filters.clientId ?? null}::uuid is null or te.client_id = ${filters.clientId ?? null})
        and (${filters.leadId ?? null}::uuid is null or te.lead_id = ${filters.leadId ?? null})
        and (${filters.teamMemberId ?? null}::uuid is null or te.team_member_id = ${filters.teamMemberId ?? null})
        and (not ${filters.ownerOnly === true} or te.team_member_id is null)
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
        null::uuid as team_member_id, null::text as team_member_name, null::uuid as work_category_id, null::text as work_category_name,
        fc.category,
        fc.amount, fc.amount as cost,
        null::uuid as invoice_id, fc.created_at
      from fixed_costs fc
      left join clients c on c.id = fc.client_id
      left join leads l on l.id = fc.lead_id
      where fc.business_id = ${businessId}
        and (${filters.clientId ?? null}::uuid is null or fc.client_id = ${filters.clientId ?? null})
        and (${filters.leadId ?? null}::uuid is null or fc.lead_id = ${filters.leadId ?? null})
        and ${filters.teamMemberId ?? null}::uuid is null
        and not ${filters.ownerOnly === true}
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
  let unbilledBillableHours = 0;
  let laborCost = 0;
  let fixedCost = 0;

  for (const e of entries) {
    if (e.entryType === "TIME") {
      if (e.billable) {
        billableHours += e.hours ?? 0;
        if (!e.invoiceId) unbilledBillableHours += e.hours ?? 0;
      } else {
        nonBillableHours += e.hours ?? 0;
      }
      laborCost += e.cost;
    } else {
      fixedCost += e.cost;
    }
  }

  const totalHours = billableHours + nonBillableHours;
  return {
    billableHours,
    nonBillableHours,
    totalHours,
    unbilledBillableHours,
    laborCost,
    fixedCost,
    totalCost: laborCost + fixedCost,
  };
}

/** Per-work-category hours/labor-cost breakdown for time entries, sorted by total hours descending. */
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
    } else {
      row.nonBillableHours += e.hours ?? 0;
    }
    row.cost += e.cost;
    byCategory.set(key, row);
  }

  return [...byCategory.values()].sort(
    (a, b) => b.billableHours + b.nonBillableHours - (a.billableHours + a.nonBillableHours)
  );
}

/** revenue (totalInvoiced) and cost are computed independently — revenue from what's actually been invoiced, cost from labor + fixed costs — rather than derived from each other, so profit means the same thing everywhere this is called. */
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
  /** Null means the business owner logged it themselves — see migration 039. */
  teamMemberId: string | null;
  categoryId: string | null;
  date: string;
  hours: number;
  /** Optional billing rate — null means no $ value has been assigned to this time yet. */
  rate: number | null;
  billable: boolean;
  description: string | null;
}

export async function createTimeEntry(businessId: string, input: TimeEntryInput): Promise<void> {
  await sql`
    insert into time_entries (client_id, lead_id, business_id, team_member_id, category_id, date, hours, rate, billable, description)
    values (
      ${input.clientId}, ${input.leadId}, ${businessId}, ${input.teamMemberId}, ${input.categoryId}, ${input.date},
      ${input.hours}, ${input.rate}, ${input.billable}, ${input.description}
    )
  `;
}

/** `restrictToTeamMemberId` (team-member role) makes this a silent no-op against another team member's entry, rather than trusting the caller's claimed ownership. */
export async function deleteTimeEntry(id: string, businessId: string, restrictToTeamMemberId?: string | null): Promise<void> {
  await sql`
    delete from time_entries
    where id = ${id} and business_id = ${businessId}
      and (${restrictToTeamMemberId ?? null}::uuid is null or team_member_id = ${restrictToTeamMemberId ?? null})
  `;
}

/** `restrictToTeamMemberId` (team-member role) makes this a silent no-op against another team member's entry, matching deleteTimeEntry's scoping. */
export async function updateTimeEntry(
  id: string,
  businessId: string,
  input: TimeEntryInput,
  restrictToTeamMemberId?: string | null
): Promise<void> {
  await sql`
    update time_entries set
      client_id = ${input.clientId},
      lead_id = ${input.leadId},
      team_member_id = ${input.teamMemberId},
      category_id = ${input.categoryId},
      date = ${input.date},
      hours = ${input.hours},
      rate = ${input.rate},
      billable = ${input.billable},
      description = ${input.description}
    where id = ${id} and business_id = ${businessId}
      and (${restrictToTeamMemberId ?? null}::uuid is null or team_member_id = ${restrictToTeamMemberId ?? null})
  `;
}

/** Billable time entries for a client that haven't been attached to an invoice yet — the source list for "generate an invoice from unbilled hours." Fixed rate first (per-entry rate if set), falling back to the client's hourly rate for entries logged with no rate. */
export async function listUnbilledTimeEntries(businessId: string, clientId: string): Promise<CostEntry[]> {
  const entries = await listCostEntries(businessId, { clientId, billable: true });
  return entries.filter((e) => e.entryType === "TIME" && !e.invoiceId);
}

/** Marks a set of time entries as billed on the given invoice, scoped to one client so a stray id from another owner can't be swept in. Used right after generating an hourly invoice from selected unbilled entries. */
export async function markTimeEntriesBilled(businessId: string, clientId: string, entryIds: string[], invoiceId: string): Promise<void> {
  if (entryIds.length === 0) return;
  await sql`
    update time_entries set invoice_id = ${invoiceId}
    where business_id = ${businessId} and client_id = ${clientId} and id = any(${entryIds}::uuid[])
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

export async function createFixedCost(businessId: string, input: FixedCostInput): Promise<void> {
  await sql`
    insert into fixed_costs (client_id, lead_id, business_id, date, description, amount, category)
    values (${input.clientId}, ${input.leadId}, ${businessId}, ${input.date}, ${input.description}, ${input.amount}, ${input.category})
  `;
}

export async function updateFixedCost(id: string, businessId: string, input: FixedCostInput): Promise<void> {
  await sql`
    update fixed_costs set
      client_id = ${input.clientId},
      lead_id = ${input.leadId},
      date = ${input.date},
      description = ${input.description},
      amount = ${input.amount},
      category = ${input.category}
    where id = ${id} and business_id = ${businessId}
  `;
}

export async function deleteFixedCost(id: string, businessId: string): Promise<void> {
  await sql`delete from fixed_costs where id = ${id} and business_id = ${businessId}`;
}
