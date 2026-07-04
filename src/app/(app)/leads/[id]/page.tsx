import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getLead } from "@/lib/data/leads";
import { deleteLead, convertLeadToClient } from "@/app/(app)/leads/actions";
import { Card } from "@/components/ui/Card";
import { LeadStatusBadge, Badge } from "@/components/ui/Badge";
import { LeadForm } from "@/components/leads/LeadForm";
import { EmailSection } from "@/components/EmailSection";
import { CostSummarySection } from "@/components/CostSummarySection";
import { NotesLog } from "@/components/NotesLog";
import { FollowUpsList } from "@/components/FollowUpsList";
import { MeetingNotesSection } from "@/components/MeetingNotesSection";
import { ScopedTaskList } from "@/components/ScopedTaskList";
import { Button, LinkButton } from "@/components/ui/Button";
import { SuccessBanner } from "@/components/ui/Toast";
import { formatCurrency, formatDate } from "@/lib/format";
import { LEAD_SOURCE_LABELS, WORK_TYPE_LABELS } from "@/lib/types";
import Link from "next/link";

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ converted?: string }>;
}) {
  const { id } = await params;
  const { converted } = await searchParams;
  const lead = await getLead(id);
  if (!lead) notFound();

  const boundDeleteLead = deleteLead.bind(null, id);
  const boundConvert = convertLeadToClient.bind(null, id);
  const owner = { type: "LEAD" as const, leadId: id };

  return (
    <div>
      {converted && (
        <SuccessBanner>
          Status set to Won — a new client was created.{" "}
          <Link href={`/clients/${converted}`} className="underline underline-offset-2 font-medium">
            View client
          </Link>
        </SuccessBanner>
      )}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-burnt-500 mb-2">
            Lead
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl font-medium text-navy-900 leading-tight">
            {lead.companyName}
          </h1>
          {lead.contactName && <p className="mt-1 text-navy-500">{lead.contactName}</p>}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <LeadStatusBadge status={lead.status} />
            {lead.workType && (
              <Badge tone="burnt">
                {lead.workType === "OTHER" ? lead.workTypeOther || "Other" : WORK_TYPE_LABELS[lead.workType]}
              </Badge>
            )}
            {lead.estimatedValue && (
              <span className="text-sm text-navy-500">
                Est. {formatCurrency(lead.estimatedValue)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lead.status === "WON" && !lead.convertedClientId && (
            <form action={boundConvert}>
              <Button variant="primary" size="sm" type="submit">
                Convert to client <ArrowRight size={15} />
              </Button>
            </form>
          )}
          {lead.convertedClientId && (
            <LinkButton href={`/clients/${lead.convertedClientId}`} variant="secondary" size="sm">
              View client <ArrowRight size={15} />
            </LinkButton>
          )}
          <form action={boundDeleteLead}>
            <Button variant="danger" size="sm" type="submit">
              Delete
            </Button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="font-heading text-lg font-medium text-navy-900 mb-4">Core info</h3>
            <LeadForm key={lead.updatedAt} lead={lead} submitLabel="Save changes" />
          </Card>

          <CostSummarySection
            entries={lead.costEntries}
            totalInvoiced={0}
            budgetedHours={null}
            reportHref={`/api/reports?${new URLSearchParams({ leadId: id, summary: "1" }).toString()}`}
          />

          <Card className="p-6">
            <h3 className="font-heading text-lg font-medium text-navy-900 mb-4">Follow-ups</h3>
            <FollowUpsList owner={{ leadId: id }} followUps={lead.followUps} />
          </Card>

          <Card className="p-6">
            <h3 className="font-heading text-lg font-medium text-navy-900 mb-4">Meeting notes</h3>
            <MeetingNotesSection owner={owner} notes={lead.meetingNotes} />
          </Card>

          <Card className="p-6">
            <h3 className="font-heading text-lg font-medium text-navy-900 mb-4">
              Activity &amp; notes
            </h3>
            <NotesLog notes={lead.notes} kind="lead" entityId={id} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-heading text-lg font-medium text-navy-900 mb-3">At a glance</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-navy-500">Estimated value</dt>
                <dd className="text-navy-800 font-medium">
                  {lead.estimatedValue ? formatCurrency(lead.estimatedValue) : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-navy-500">Source</dt>
                <dd className="text-navy-800 font-medium">
                  {lead.source
                    ? lead.source === "OTHER"
                      ? lead.sourceOther || "Other"
                      : LEAD_SOURCE_LABELS[lead.source]
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-navy-500">In pipeline since</dt>
                <dd className="text-navy-800 font-medium">{formatDate(lead.createdAt)}</dd>
              </div>
            </dl>
          </Card>

          <EmailSection
            contactEmail={lead.contactEmail}
            contactName={lead.contactName}
            companyName={lead.companyName}
          />

          <Card className="p-6">
            <h3 className="font-heading text-lg font-medium text-navy-900 mb-3">Tasks</h3>
            <ScopedTaskList owner={owner} tasks={lead.tasks} />
          </Card>
        </div>
      </div>
    </div>
  );
}
