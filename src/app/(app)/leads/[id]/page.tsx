import { notFound } from "next/navigation";
import { ArrowRight, IdCard, CalendarClock, NotebookPen, StickyNote, BarChart3, CheckSquare } from "lucide-react";
import { getLead } from "@/lib/data/leads";
import { listCostEntries } from "@/lib/data/costEntries";
import { getCurrentUser } from "@/lib/currentUser";
import { deleteLead, convertLeadToClient, setLeadColor } from "@/app/(app)/leads/actions";
import { Card } from "@/components/ui/Card";
import { PanelHeading } from "@/components/ui/PanelHeading";
import { BackLink } from "@/components/ui/BackLink";
import { LeadStatusBadge, Badge } from "@/components/ui/Badge";
import { EntityColorPicker } from "@/components/ui/EntityColorPicker";
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
import { listWorkTypes } from "@/lib/data/workTypes";
import { listLeadSources } from "@/lib/data/leadSources";
import { getToday } from "@/lib/data/profile";
import Link from "next/link";

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ converted?: string; costFrom?: string; costTo?: string }>;
}) {
  const { id } = await params;
  const { converted, costFrom, costTo } = await searchParams;
  const user = await getCurrentUser();
  const isOwner = user?.role === "OWNER";
  const [lead, costEntries, workTypes, leadSources, today] = await Promise.all([
    getLead(id),
    isOwner ? listCostEntries({ leadId: id, dateFrom: costFrom, dateTo: costTo }) : Promise.resolve([]),
    listWorkTypes({ includeInactive: true }),
    listLeadSources({ includeInactive: true }),
    getToday(),
  ]);
  if (!lead) notFound();

  // Every to-do board is private — a lead's Tasks panel only ever shows the
  // current viewer's own to-dos for that lead, never a colleague's.
  const selfAssigneeId = user?.role === "TEAM_MEMBER" ? user.teamMember.id : null;
  const myTasks = lead.tasks.filter((t) => t.assignedToTeamMemberId === selfAssigneeId);

  const boundDeleteLead = deleteLead.bind(null, id);
  const boundConvert = convertLeadToClient.bind(null, id);
  const owner = { type: "LEAD" as const, leadId: id };

  return (
    <div>
      <BackLink href="/leads" label="Back to leads" />
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
            <EntityColorPicker color={lead.color} onSelect={setLeadColor.bind(null, id)} />
            <LeadStatusBadge status={lead.status} />
            {(lead.workTypeName || lead.workTypeOther) && (
              <Badge tone="burnt">{lead.workTypeOther || lead.workTypeName}</Badge>
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
            <PanelHeading icon={IdCard} tone="slate" title="Core information" />
            <LeadForm
              key={lead.updatedAt}
              lead={lead}
              workTypes={workTypes}
              leadSources={leadSources}
              submitLabel="Save changes"
              variant="compact"
            />
          </Card>

          {isOwner && (
            <CostSummarySection
              entries={costEntries}
              totalInvoiced={0}
              budgetedHours={null}
              reportHref={`/api/reports?${new URLSearchParams({
                leadId: id,
                summary: "1",
                ...(costFrom ? { dateFrom: costFrom } : {}),
                ...(costTo ? { dateTo: costTo } : {}),
              }).toString()}`}
              logHref={`/tracker?logTime=1&leadId=${id}`}
              dateFrom={costFrom}
              dateTo={costTo}
            />
          )}

          <Card className="p-6">
            <PanelHeading icon={CalendarClock} tone="slate" title="Follow-ups" />
            <FollowUpsList owner={{ leadId: id }} followUps={lead.followUps} today={today} />
          </Card>

          <Card className="p-6">
            <PanelHeading icon={NotebookPen} tone="slate" title="Meeting notes" />
            <MeetingNotesSection owner={owner} notes={lead.meetingNotes} />
          </Card>

          <Card className="p-6">
            <PanelHeading icon={StickyNote} tone="slate" title="Activity & notes" />
            <NotesLog notes={lead.notes} kind="lead" entityId={id} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <PanelHeading icon={BarChart3} tone="slate" title="At a glance" />
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
                  {lead.sourceName || lead.sourceOther ? lead.sourceOther || lead.sourceName : "—"}
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
            <PanelHeading icon={CheckSquare} tone="sage" title="Tasks" />
            <ScopedTaskList owner={owner} tasks={myTasks} today={today} />
          </Card>
        </div>
      </div>
    </div>
  );
}
