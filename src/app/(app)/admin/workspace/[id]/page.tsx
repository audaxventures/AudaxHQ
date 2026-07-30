import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Building2, Target, CheckSquare, CalendarClock, NotebookPen, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeedbackStatusBadge } from "@/components/ui/Badge";
import { WorkspaceTierSelect } from "@/components/admin/WorkspaceTierSelect";
import { getWorkspaceDetail } from "@/lib/data/admin";
import { listFeedbackForBusiness } from "@/lib/data/feedback";
import { formatDate } from "@/lib/format";
import type { SubscriptionStatus } from "@/lib/types";

const SUBSCRIPTION_STATUS_TONE = {
  trialing: "gold",
  active: "sage",
  past_due: "brick",
  canceled: "slate",
} as const;

const SUBSCRIPTION_STATUS_LABEL = {
  trialing: "Trial",
  active: "Active",
  past_due: "Payment failed",
  canceled: "Canceled",
} as const;

function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus | null }) {
  if (!status) return <Badge tone="slate">No subscription</Badge>;
  return <Badge tone={SUBSCRIPTION_STATUS_TONE[status]}>{SUBSCRIPTION_STATUS_LABEL[status]}</Badge>;
}

function StatTile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-navy-100 p-4">
      <Icon size={16} className="mb-2 text-navy-400" />
      <p className="font-heading text-xl font-semibold text-navy-900 tabular-nums leading-tight">{value}</p>
      <p className="text-xs text-navy-500">{label}</p>
    </div>
  );
}

export default async function AdminWorkspaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [workspace, feedback] = await Promise.all([getWorkspaceDetail(id), listFeedbackForBusiness(id)]);

  if (!workspace) notFound();

  const isSuspended = workspace.suspendedAt !== null;

  return (
    <div>
      <Link href="/admin" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800">
        <ArrowLeft size={15} />
        Back to workspaces
      </Link>

      <Card className="p-6 mb-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-medium text-navy-900">{workspace.name}</h2>
            <p className="text-sm text-navy-500">
              {workspace.ownerName} · {workspace.ownerEmail}
            </p>
            <p className="mt-1 text-xs text-navy-400">Created {formatDate(workspace.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <WorkspaceTierSelect businessId={workspace.id} tier={workspace.tier} />
            <Badge tone={isSuspended ? "brick" : "sage"}>{isSuspended ? "Suspended" : "Active"}</Badge>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-navy-100 bg-cream-50 px-4 py-3">
          <SubscriptionStatusBadge status={workspace.subscriptionStatus} />
          {workspace.billingInterval && (
            <span className="text-xs text-navy-500">{workspace.billingInterval === "annual" ? "Billed annually" : "Billed monthly"}</span>
          )}
          {workspace.subscriptionStatus === "trialing" && workspace.trialEndsAt && (
            <span className="text-xs text-navy-500">Trial ends {formatDate(workspace.trialEndsAt)}</span>
          )}
          {workspace.stripeCustomerId ? (
            <a
              href={`https://dashboard.stripe.com/customers/${workspace.stripeCustomerId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-burnt-600 hover:text-burnt-700"
            >
              View in Stripe <ExternalLink size={12} />
            </a>
          ) : (
            <span className="ml-auto text-xs text-navy-400">No Stripe customer</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile icon={Users} label="Team members" value={workspace.teamMemberCount} />
          <StatTile icon={Building2} label="Clients" value={workspace.clientCount} />
          <StatTile icon={Target} label="Leads" value={workspace.leadCount} />
          <StatTile icon={CheckSquare} label="Tasks" value={workspace.taskCount} />
          <StatTile icon={CalendarClock} label="Follow-ups" value={workspace.followUpCount} />
          <StatTile icon={NotebookPen} label="Meeting notes" value={workspace.meetingNoteCount} />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 font-heading text-lg font-medium text-navy-900">Feedback from this workspace</h3>
        {feedback.length === 0 ? (
          <EmptyState title="No feedback submitted yet" />
        ) : (
          <div className="space-y-3">
            {feedback.map((f) => (
              <div key={f.id} className="rounded-xl border border-navy-100 p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <p className="text-xs text-navy-400">
                    {f.submittedByName} ({f.submittedByRole === "OWNER" ? "Owner" : "Team member"}) · {formatDate(f.createdAt)}
                  </p>
                  <FeedbackStatusBadge status={f.status} />
                </div>
                <p className="text-sm text-navy-700 whitespace-pre-wrap">{f.message}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
