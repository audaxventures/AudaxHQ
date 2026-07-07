import { notFound } from "next/navigation";
import {
  IdCard,
  Receipt,
  CalendarClock,
  NotebookPen,
  FileText,
  StickyNote,
  CheckSquare,
  Link2,
  DollarSign,
} from "lucide-react";
import { getClient, listClients } from "@/lib/data/clients";
import { listLeads } from "@/lib/data/leads";
import { listCostEntries } from "@/lib/data/costEntries";
import { listTeamMembers } from "@/lib/data/teamMembers";
import { listWorkCategories } from "@/lib/data/workCategories";
import { accessibleClientIdsFor } from "@/lib/data/clientAccess";
import { getCurrentUser } from "@/lib/currentUser";
import { activateClient, archiveClient, setClientColor } from "@/app/(app)/clients/actions";
import { Card } from "@/components/ui/Card";
import { PanelHeading } from "@/components/ui/PanelHeading";
import { BackLink } from "@/components/ui/BackLink";
import { ClientStatusBadge, Badge } from "@/components/ui/Badge";
import { EntityColorPicker } from "@/components/ui/EntityColorPicker";
import { ClientForm } from "@/components/clients/ClientForm";
import { ClientLinks } from "@/components/clients/ClientLinks";
import { InvoicesList } from "@/components/clients/InvoicesList";
import { FollowUpsList } from "@/components/FollowUpsList";
import { MeetingNotesSection } from "@/components/MeetingNotesSection";
import { EmailSection } from "@/components/EmailSection";
import { DocumentsSection } from "@/components/clients/DocumentsSection";
import { CostSummarySection } from "@/components/CostSummarySection";
import { ScopedTaskList } from "@/components/ScopedTaskList";
import { NotesLog } from "@/components/NotesLog";
import { formatCurrency, isDateInRange } from "@/lib/format";
import { listWorkTypes } from "@/lib/data/workTypes";
import { getToday } from "@/lib/data/profile";
import { Button } from "@/components/ui/Button";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ costFrom?: string; costTo?: string }>;
}) {
  const { id } = await params;
  const { costFrom, costTo } = await searchParams;
  const user = await getCurrentUser();
  const isOwner = user?.role === "OWNER";
  if (user && !isOwner) {
    const accessibleClientIds = await accessibleClientIdsFor(user);
    if (!accessibleClientIds?.includes(id)) notFound();
  }
  const [client, costEntries, workTypes, today, teamMembers, workCategories, allClients, leads] = await Promise.all([
    getClient(id),
    isOwner ? listCostEntries({ clientId: id, dateFrom: costFrom, dateTo: costTo }) : Promise.resolve([]),
    listWorkTypes({ includeInactive: true }),
    getToday(),
    isOwner ? listTeamMembers() : Promise.resolve([]),
    isOwner ? listWorkCategories() : Promise.resolve([]),
    isOwner ? listClients() : Promise.resolve([]),
    isOwner ? listLeads() : Promise.resolve([]),
  ]);
  if (!client) notFound();

  // Every to-do board is private — a client's Tasks panel only ever shows
  // the current viewer's own to-dos for that client, never a colleague's.
  const selfAssigneeId = user?.role === "TEAM_MEMBER" ? user.teamMember.id : null;
  const myTasks = client.tasks.filter((t) => t.assignedToTeamMemberId === selfAssigneeId);

  const isArchived = client.status === "CHURNED";
  const boundArchiveClient = archiveClient.bind(null, id);
  const boundActivateClient = activateClient.bind(null, id);
  const owner = { type: "CLIENT" as const, clientId: id };

  return (
    <div>
      <BackLink href="/clients" label="Back to clients" />
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-burnt-500 mb-2">
            Client
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl font-medium text-navy-900 leading-tight">
            {client.companyName}
          </h1>
          {client.contactName && <p className="mt-1 text-navy-500">{client.contactName}</p>}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <EntityColorPicker color={client.color} onSelect={setClientColor.bind(null, id)} />
            <ClientStatusBadge status={client.status} />
            <Badge tone="navy">{client.type === "PROJECT" ? "Project-based" : "Recurring"}</Badge>
            {(client.workTypeName || client.workTypeOther) && (
              <Badge tone="burnt">{client.workTypeOther || client.workTypeName}</Badge>
            )}
          </div>
        </div>
        <form action={isArchived ? boundActivateClient : boundArchiveClient}>
          <Button variant={isArchived ? "primary" : "secondary"} size="sm" type="submit">
            {isArchived ? "Activate client" : "Archive client"}
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <PanelHeading icon={IdCard} tone="slate" title="Core information" />
            <ClientForm
              key={client.updatedAt}
              client={client}
              workTypes={workTypes}
              submitLabel="Save changes"
              variant="compact"
              hideRate={!isOwner}
            />
          </Card>

          {isOwner && (
            <>
              <Card className="p-6">
                <PanelHeading icon={Receipt} tone="slate" title="Invoices" />
                <p className="text-sm text-navy-500 mb-4">
                  {client.type === "RECURRING"
                    ? "One entry per month, created automatically — add one-off invoices any time."
                    : "Split the project total across deposits, milestones, or however you invoice this client."}
                </p>
                <InvoicesList clientId={id} invoices={client.invoices} />
              </Card>

              <CostSummarySection
                entries={costEntries}
                clients={allClients}
                leads={leads}
                teamMembers={teamMembers}
                workCategories={workCategories}
                totalInvoiced={client.invoices
                  .filter((i) => i.status !== "NOT_INVOICED")
                  .filter((i) => isDateInRange(i.invoicedDate, costFrom, costTo))
                  .reduce((sum, i) => sum + Number(i.amount), 0)}
                budgetedHours={client.budgetedHours}
                reportHref={`/api/reports?${new URLSearchParams({
                  clientId: id,
                  summary: "1",
                  ...(costFrom ? { dateFrom: costFrom } : {}),
                  ...(costTo ? { dateTo: costTo } : {}),
                }).toString()}`}
                logHref={`/tracker?logTime=1&clientId=${id}`}
                dateFrom={costFrom}
                dateTo={costTo}
              />
            </>
          )}

          <Card className="p-6">
            <PanelHeading icon={CalendarClock} tone="slate" title="Follow-ups" />
            <FollowUpsList owner={{ clientId: id }} followUps={client.followUps} today={today} />
          </Card>

          <Card className="p-6">
            <PanelHeading icon={NotebookPen} tone="slate" title="Meeting notes" />
            <MeetingNotesSection owner={owner} notes={client.meetingNotes} />
          </Card>

          <Card className="p-6">
            <PanelHeading icon={FileText} tone="slate" title="Documents" />
            <DocumentsSection clientId={id} documents={client.documents} />
          </Card>

          <Card className="p-6">
            <PanelHeading icon={StickyNote} tone="slate" title="Activity & notes" />
            <NotesLog notes={client.notes} kind="client" entityId={id} />
          </Card>
        </div>

        <div className="space-y-6">
          {isOwner && (
            <Card tone="burnt" variant="solid" className="p-6">
              <PanelHeading
                icon={DollarSign}
                tone="burnt"
                title={client.type === "RECURRING" ? "Monthly fee" : "Project total"}
              />
              <p className="font-heading text-2xl text-navy-900">{formatCurrency(client.rate)}</p>
              {client.type === "RECURRING" && <p className="text-xs text-navy-500">/ month</p>}
            </Card>
          )}

          <EmailSection
            contactEmail={client.contactEmail}
            contactName={client.contactName}
            companyName={client.companyName}
          />

          <Card className="p-6">
            <PanelHeading icon={CheckSquare} tone="sage" title="Tasks" />
            <ScopedTaskList owner={owner} tasks={myTasks} today={today} />
          </Card>

          <Card className="p-6">
            <PanelHeading icon={Link2} tone="slate" title="Links" />
            <ClientLinks clientId={id} links={client.links} />
          </Card>
        </div>
      </div>
    </div>
  );
}
