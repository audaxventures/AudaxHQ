import { ShieldCheck, Building2, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getPlatformStats, listWorkspaces } from "@/lib/data/admin";
import { requirePlatformAdmin } from "@/lib/currentUser";
import { suspendWorkspace, reactivateWorkspace } from "@/app/(app)/admin/actions";
import { DeleteWorkspaceButton } from "@/components/admin/DeleteWorkspaceButton";
import { formatDate } from "@/lib/format";
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

export default async function AdminPage() {
  await requirePlatformAdmin();
  const [stats, workspaces] = await Promise.all([getPlatformStats(), listWorkspaces()]);

  return (
    <div>
      <PageHeader
        icon={ShieldCheck}
        tone="navy"
        eyebrow="Platform Admin"
        title="Admin"
        description="Every workspace on Audax HQ, in one place."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Workspaces" value={String(stats.totalWorkspaces)} tone="navy" />
        <StatTile label="Active" value={String(stats.activeWorkspaces)} tone="sage" />
        <StatTile label="Suspended" value={String(stats.suspendedWorkspaces)} tone="burnt" />
        <StatTile label="Total users" value={String(stats.totalUsers)} tone="slate" />
        <StatTile label="Revenue" value="—" subtext="Billing not yet enabled" tone="gold" />
      </div>

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
                  <div className="min-w-0 flex-1">
                    <p className="font-heading text-base font-medium text-navy-900">{ws.name}</p>
                    <p className="text-sm text-navy-500">
                      {ws.ownerName} · {ws.ownerEmail}
                    </p>
                  </div>
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
