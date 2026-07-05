import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { TrackerFilters } from "@/components/tracker/TrackerFilters";
import { CostEntryTable } from "@/components/tracker/CostEntryTable";
import { AddEntryForm } from "@/components/tracker/AddEntryForm";
import { listCostEntries, rollupCostEntries } from "@/lib/data/costEntries";
import { listTeamMembers } from "@/lib/data/teamMembers";
import { listWorkCategories } from "@/lib/data/workCategories";
import { listClients } from "@/lib/data/clients";
import { listLeads } from "@/lib/data/leads";
import { formatCurrency } from "@/lib/format";
import type { Tone } from "@/lib/tone";

function StatTile({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  return (
    <Card tone={tone} variant="solid" className="p-4">
      <p className="font-heading text-2xl font-semibold text-navy-900 tabular-nums leading-tight">{value}</p>
      <p className="text-xs font-semibold text-navy-600">{label}</p>
    </Card>
  );
}

export default async function TrackerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters = {
    clientId: sp.clientId || undefined,
    leadId: sp.leadId || undefined,
    teamMemberId: sp.teamMemberId || undefined,
    workCategoryId: sp.workCategoryId || undefined,
    billable: sp.billable === "true" ? true : sp.billable === "false" ? false : undefined,
    dateFrom: sp.dateFrom || undefined,
    dateTo: sp.dateTo || undefined,
  };

  const [entries, teamMembers, workCategories, clients, leads] = await Promise.all([
    listCostEntries(filters),
    listTeamMembers({ includeInactive: true }),
    listWorkCategories({ includeInactive: true }),
    listClients(),
    listLeads(),
  ]);

  const rollup = rollupCostEntries(entries);

  const reportQuery = new URLSearchParams();
  if (filters.clientId) reportQuery.set("clientId", filters.clientId);
  if (filters.leadId) reportQuery.set("leadId", filters.leadId);
  if (filters.teamMemberId) reportQuery.set("teamMemberId", filters.teamMemberId);
  if (filters.workCategoryId) reportQuery.set("workCategoryId", filters.workCategoryId);
  if (filters.billable !== undefined) reportQuery.set("billable", String(filters.billable));
  if (filters.dateFrom) reportQuery.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) reportQuery.set("dateTo", filters.dateTo);

  return (
    <div>
      <PageHeader
        icon={Clock}
        tone="navy"
        eyebrow="Time & Cost"
        title="Hour & Cost Tracker"
        description="Log time and expenses against clients and leads to see real profitability, not just invoicing status."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Hours logged" value={rollup.totalHours.toFixed(1)} tone="navy" />
        <StatTile label="Variable cost" value={formatCurrency(rollup.variableCost)} tone="burnt" />
        <StatTile label="Fixed cost" value={formatCurrency(rollup.fixedCost)} tone="gold" />
        <StatTile label="Total cost" value={formatCurrency(rollup.totalCost)} tone="slate" />
      </div>

      <Card className="mb-6 p-6">
        <TrackerFilters clients={clients} leads={leads} teamMembers={teamMembers} workCategories={workCategories} filters={sp} />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-lg font-medium text-navy-900">Entry log</h3>
              <a
                href={`/api/reports?${reportQuery.toString()}`}
                className="text-sm font-medium text-burnt-600 hover:text-burnt-700 hover:underline"
              >
                Download report
              </a>
            </div>
            <CostEntryTable entries={entries} showOwner deletable />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4 font-heading text-lg font-medium text-navy-900">Add entry</h3>
            <AddEntryForm
              clients={clients}
              leads={leads}
              teamMembers={teamMembers.filter((t) => t.active)}
              workCategories={workCategories.filter((c) => c.active)}
            />
          </Card>

          <Card className="p-6">
            <h3 className="mb-2 font-heading text-lg font-medium text-navy-900">Team &amp; categories</h3>
            <p className="mb-3 text-sm text-navy-500">
              Add, edit, or archive team members and work categories from Settings.
            </p>
            <Link
              href="/settings/team-members"
              className="flex items-center gap-1.5 text-sm font-medium text-burnt-600 hover:text-burnt-700"
            >
              Go to Settings <ArrowRight size={14} />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
