import { Download, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { TrackerFilters } from "@/components/tracker/TrackerFilters";
import { FinanceTabs } from "@/components/finance/FinanceTabs";
import { CostEntryLog } from "@/components/tracker/CostEntryLog";
import { LogTimeEntryButton } from "@/components/tracker/LogTimeEntryButton";
import { Pagination } from "@/components/ui/Pagination";
import { listCostEntries, rollupCostEntries } from "@/lib/data/costEntries";
import { listTeamMembers } from "@/lib/data/teamMembers";
import { listWorkCategories } from "@/lib/data/workCategories";
import { listClients } from "@/lib/data/clients";
import { listLeads } from "@/lib/data/leads";
import { accessibleClientIdsFor } from "@/lib/data/clientAccess";
import { requireCurrentUser } from "@/lib/currentUser";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";
import { FIXED_COST_CATEGORY_LABELS } from "@/lib/types";
import type { Tone } from "@/lib/tone";

const PAGE_SIZE = 15;

function StatTile({ label, value, subtext, tone }: { label: string; value: string; subtext?: string; tone: Tone }) {
  return (
    <Card tone={tone} variant="solid" className="p-4">
      <p className="font-heading text-2xl font-semibold text-navy-900 tabular-nums leading-tight">{value}</p>
      <p className="text-xs font-semibold text-navy-600">{label}</p>
      {subtext && <p className="mt-0.5 text-xs text-navy-400">{subtext}</p>}
    </Card>
  );
}

export default async function TrackerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const user = await requireCurrentUser();
  const isOwner = user.role === "OWNER";
  const teamMember = user.role === "TEAM_MEMBER" ? user.teamMember : null;
  const accessibleClientIds = await accessibleClientIdsFor(user);

  // Team members only ever see their own log, so the "who" filter is owner-only.
  // "OWNER" is the filter bar's sentinel for "just my own entries" (team_member_id is null) —
  // the owner has no real team_members row to filter by (see TrackerFilters.tsx).
  const rawTeamMemberFilter = isOwner ? sp.teamMemberId || undefined : undefined;
  const ownerOnlyFilter = rawTeamMemberFilter === "OWNER";
  const filters = {
    clientId: sp.clientId || undefined,
    leadId: sp.leadId || undefined,
    teamMemberId: ownerOnlyFilter ? undefined : rawTeamMemberFilter,
    ownerOnly: ownerOnlyFilter,
    workCategoryId: sp.workCategoryId || undefined,
    billable: sp.billable === "true" ? true : sp.billable === "false" ? false : undefined,
    dateFrom: sp.dateFrom || undefined,
    dateTo: sp.dateTo || undefined,
    restrictToTeamMemberId: teamMember?.id,
    restrictToClientIds: teamMember ? accessibleClientIds : undefined,
  };
  const showArchived = sp.archived === "true";
  const search = (sp.q ?? "").trim().toLowerCase();
  const page = Math.max(1, Number(sp.page) || 1);

  const [allEntries, teamMembers, workCategories, clients, leads] = await Promise.all([
    listCostEntries(user.businessId, filters),
    listTeamMembers(user.businessId, { includeInactive: true }),
    listWorkCategories(user.businessId, { includeInactive: true }),
    listClients(user.businessId, { accessibleClientIds }),
    listLeads(user.businessId),
  ]);

  const inactiveTeamMemberIds = new Set(teamMembers.filter((t) => !t.active).map((t) => t.id));
  const inactiveCategoryIds = new Set(workCategories.filter((c) => !c.active).map((c) => c.id));
  const churnedClientIds = new Set(clients.filter((c) => c.status === "CHURNED").map((c) => c.id));

  let entries = allEntries;
  if (!showArchived) {
    entries = entries.filter((e) => {
      if (e.clientId && churnedClientIds.has(e.clientId)) return false;
      if (e.teamMemberName && e.entryType === "TIME") {
        const tm = teamMembers.find((t) => t.name === e.teamMemberName);
        if (tm && inactiveTeamMemberIds.has(tm.id)) return false;
      }
      if (e.workCategoryId && inactiveCategoryIds.has(e.workCategoryId)) return false;
      return true;
    });
  }
  if (search) {
    entries = entries.filter((e) => {
      const categoryLabel =
        e.entryType === "TIME" ? e.workCategoryName ?? "Uncategorized" : e.category ? FIXED_COST_CATEGORY_LABELS[e.category] : "";
      const haystack = [e.ownerName, e.description, e.teamMemberName, categoryLabel].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(search);
    });
  }

  const rollup = rollupCostEntries(entries);
  const billablePercent = rollup.totalHours > 0 ? (rollup.billableHours / rollup.totalHours) * 100 : null;

  const total = entries.length;
  const start = (page - 1) * PAGE_SIZE;
  // CostEntryTable is a Client Component — its props (including rate/amount/cost)
  // are serialized to the browser regardless of which columns get rendered,
  // so strip the $ fields here rather than trusting hideFinancials alone.
  const pageEntries = entries
    .slice(start, start + PAGE_SIZE)
    .map((e) => (isOwner ? e : { ...e, rate: null, amount: null, cost: 0 }));

  const filterParams: Record<string, string | undefined> = {
    clientId: filters.clientId,
    leadId: filters.leadId,
    teamMemberId: rawTeamMemberFilter,
    workCategoryId: filters.workCategoryId,
    billable: sp.billable,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    q: sp.q,
    archived: sp.archived,
  };

  function buildPageHref(targetPage: number) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filterParams)) {
      if (v) params.set(k, v);
    }
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `/tracker?${qs}` : "/tracker";
  }

  const reportQuery = new URLSearchParams();
  if (filters.clientId) reportQuery.set("clientId", filters.clientId);
  if (filters.leadId) reportQuery.set("leadId", filters.leadId);
  if (rawTeamMemberFilter) reportQuery.set("teamMemberId", rawTeamMemberFilter);
  if (filters.workCategoryId) reportQuery.set("workCategoryId", filters.workCategoryId);
  if (filters.billable !== undefined) reportQuery.set("billable", String(filters.billable));
  if (filters.dateFrom) reportQuery.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) reportQuery.set("dateTo", filters.dateTo);

  const activeTeamMembers = teamMembers.filter((t) => t.active);
  const activeWorkCategories = workCategories.filter((c) => c.active);
  const filterClients = showArchived ? clients : clients.filter((c) => c.status !== "CHURNED");
  // The owner isn't a pickable team member anywhere — "Me" (Log Time) / "Me (Owner)"
  // (filter) stand in for them instead. See migration 039 + TrackerFilters.tsx.
  const pickableActiveTeamMembers = activeTeamMembers.filter((t) => t.id !== user.business.ownerTeamMemberId);
  const filterTeamMembers = (showArchived ? teamMembers : activeTeamMembers).filter(
    (t) => t.id !== user.business.ownerTeamMemberId
  );
  const filterWorkCategories = showArchived ? workCategories : activeWorkCategories;

  return (
    <div>
      <PageHeader
        icon={Clock}
        tone="navy"
        eyebrow="Finance & Time"
        title="Hour & Cost Tracker"
        description="Log hours and expenses against clients and leads — see profitability on each client's Finance & Time tab"
        action={
          <div className="flex items-center gap-3">
            {isOwner && (
              <LinkButton variant="secondary" href={`/api/reports?${reportQuery.toString()}`}>
                <Download size={16} /> Export report
              </LinkButton>
            )}
            <LogTimeEntryButton
              clients={clients}
              leads={leads}
              teamMembers={pickableActiveTeamMembers}
              workCategories={activeWorkCategories}
              lockedTeamMember={teamMember ? { id: teamMember.id, name: teamMember.name } : undefined}
            />
          </div>
        }
      />

      {isOwner && <FinanceTabs active="tracker" />}

      <div className={cn("mb-6 grid grid-cols-2 gap-4", isOwner ? "sm:grid-cols-4" : "sm:grid-cols-2")}>
        <StatTile label="Hours logged" value={rollup.totalHours.toFixed(1)} tone="navy" />
        <StatTile
          label="Billable hours"
          value={rollup.billableHours.toFixed(1)}
          subtext={billablePercent !== null ? `${billablePercent.toFixed(1)}% of total` : undefined}
          tone="slate"
        />
        {isOwner && (
          <>
            <StatTile
              label="Unbilled billable hours"
              value={rollup.unbilledBillableHours.toFixed(1)}
              subtext="Ready to invoice"
              tone="gold"
            />
            <StatTile label="Total cost" value={formatCurrency(rollup.totalCost)} subtext="Labor + fixed costs" tone="burnt" />
          </>
        )}
      </div>

      <Card className="mb-6 p-6">
        <TrackerFilters
          clients={filterClients}
          leads={leads}
          teamMembers={filterTeamMembers}
          workCategories={filterWorkCategories}
          filters={filterParams}
          hideTeamMemberFilter={!isOwner}
        />
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 font-heading text-lg font-medium text-navy-900">Entry log</h3>
        <CostEntryLog
          entries={pageEntries}
          clients={clients}
          leads={leads}
          teamMembers={pickableActiveTeamMembers}
          workCategories={activeWorkCategories}
          lockedTeamMember={teamMember ? { id: teamMember.id, name: teamMember.name } : undefined}
          showOwner
          hideFinancials={!isOwner}
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} itemLabel="entries" buildHref={buildPageHref} />
      </Card>
    </div>
  );
}
