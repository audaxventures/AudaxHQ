import { Building2, Users, Target, CheckSquare, CalendarClock, NotebookPen } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GrowthChartCard } from "@/components/admin/GrowthChartCard";
import { TimeSeriesChart } from "@/components/admin/TimeSeriesChart";
import { getPlatformStats, getGrowthSeries, getPlatformActivityCounts, listWorkspaces } from "@/lib/data/admin";
import { suspendWorkspace, reactivateWorkspace } from "@/app/(app)/admin/actions";
import { DeleteWorkspaceButton } from "@/components/admin/DeleteWorkspaceButton";
import { formatDate } from "@/lib/format";
import Link from "next/link";
import type { Tone } from "@/lib/tone";

function StatTile({ label, value, subtext, tone }: { label: string; value: string; subtext?: string; tone: Tone }) {
  return (
    <Card tone={tone} variant="solid" className="p-4">
      <p className="font-heading text-2xl font-semibold text-navy-900 tabular-nums leading-tight">{value}</p>
      <p className="text-xs font-semibold text-navy-600">{label}</p>
      {subtext && <p className="mt-0.5 text-xs text-navy-400">{subtext}</p>}
    </Card>
  );
}

function ActivityTile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-100 text-navy-600">
        <Icon size={16} />
      </div>
      <div>
        <p className="font-heading text-lg font-semibold text-navy-900 tabular-nums leading-tight">{value.toLocaleString()}</p>
        <p className="text-xs text-navy-500">{label}</p>
      </div>
    </div>
  );
}

export default async function AdminOverviewPage() {
  const [stats, growth, activity, workspaces] = await Promise.all([
    getPlatformStats(),
    getGrowthSeries(),
    getPlatformActivityCounts(),
    listWorkspaces(),
  ]);

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Active workspaces" value={String(stats.activeWorkspaces)} tone="sage" />
        <StatTile label="Suspended" value={String(stats.suspendedWorkspaces)} tone="burnt" />
        <StatTile label="Total users" value={String(stats.totalUsers)} tone="navy" />
        <StatTile label="New signups (30d)" value={String(stats.newSignups30d)} tone="slate" />
        <StatTile label="MRR" value="—" subtext="Billing not yet enabled" tone="gold" />
        <StatTile label="Free trial" value="—" subtext="No trial period yet" tone="gold" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GrowthChartCard data={growth} />
        <Card className="p-6">
          <h3 className="mb-4 font-heading text-lg font-medium text-navy-900">Revenue</h3>
          <TimeSeriesChart
            data={[]}
            color="#55637a"
            fillColor="#e7eaf0"
            emptyTitle="No revenue data yet"
            emptyDescription="This will chart monthly recurring revenue once billing is live."
          />
        </Card>
      </div>

      <Card className="p-6 mb-6">
        <h3 className="mb-5 font-heading text-lg font-medium text-navy-900">Platform activity</h3>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          <ActivityTile icon={Building2} label="Clients created" value={activity.clients} />
          <ActivityTile icon={Target} label="Leads created" value={activity.leads} />
          <ActivityTile icon={CheckSquare} label="Tasks created" value={activity.tasks} />
          <ActivityTile icon={CalendarClock} label="Follow-ups created" value={activity.followUps} />
          <ActivityTile icon={NotebookPen} label="Meeting notes created" value={activity.meetingNotes} />
        </div>
      </Card>

      <Card className="p-6">
        {workspaces.length === 0 ? (
          <EmptyState title="No workspaces yet" description="New signups will show up here." />
        ) : (
          <div className="space-y-3">
            <div className="hidden px-1 pb-2 sm:flex sm:items-center sm:gap-3">
              <p className="flex-1 text-xs font-medium uppercase tracking-wide text-navy-400">Workspace</p>
              <p className="w-24 shrink-0 text-center text-xs font-medium uppercase tracking-wide text-navy-400">Team</p>
              <p className="w-24 shrink-0 text-center text-xs font-medium uppercase tracking-wide text-navy-400">Clients</p>
              <p className="w-28 shrink-0 text-xs font-medium uppercase tracking-wide text-navy-400">Created</p>
              <p className="w-24 shrink-0 text-xs font-medium uppercase tracking-wide text-navy-400">Status</p>
              <span className="w-28 shrink-0" />
            </div>
            {workspaces.map((ws) => {
              const isSuspended = ws.suspendedAt !== null;
              return (
                <div
                  key={ws.id}
                  className="flex flex-col gap-3 rounded-2xl bg-white px-5 py-4 shadow-[0_1px_2px_rgba(16,29,51,0.04),0_8px_24px_-16px_rgba(16,29,51,0.15)] sm:flex-row sm:items-center"
                >
                  <Link href={`/admin/workspace/${ws.id}`} className="min-w-0 flex-1 hover:opacity-80">
                    <p className="font-heading text-base font-medium text-navy-900">{ws.name}</p>
                    <p className="text-sm text-navy-500">
                      {ws.ownerName} · {ws.ownerEmail}
                    </p>
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:flex-nowrap">
                    <div className="flex items-center gap-1.5 text-sm text-navy-600 sm:w-24 sm:justify-center">
                      <Users size={14} className="text-navy-400" />
                      {ws.teamMemberCount}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-navy-600 sm:w-24 sm:justify-center">
                      <Building2 size={14} className="text-navy-400" />
                      {ws.clientCount}
                    </div>
                    <p className="text-sm text-navy-500 sm:w-28">{formatDate(ws.createdAt)}</p>
                    <div className="sm:w-24">
                      <Badge tone={isSuspended ? "brick" : "sage"}>{isSuspended ? "Suspended" : "Active"}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <form action={isSuspended ? reactivateWorkspace.bind(null, ws.id) : suspendWorkspace.bind(null, ws.id)} className="sm:w-28">
                        <Button variant={isSuspended ? "primary" : "danger"} size="sm" type="submit" className="w-full">
                          {isSuspended ? "Reactivate" : "Suspend"}
                        </Button>
                      </form>
                      {isSuspended && (
                        <div className="sm:w-36">
                          <DeleteWorkspaceButton businessId={ws.id} workspaceName={ws.name} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
