import { notFound } from "next/navigation";
import {
  IdCard,
  CalendarClock,
  NotebookPen,
  FileText,
  StickyNote,
  DollarSign,
} from "lucide-react";
import { getClient, listClients } from "@/lib/data/clients";
import { listLeads } from "@/lib/data/leads";
import { listCostEntries, listUnbilledTimeEntries } from "@/lib/data/costEntries";
import { listTeamMembers } from "@/lib/data/teamMembers";
import { listWorkCategories } from "@/lib/data/workCategories";
import { accessibleClientIdsFor, listAllClientAccess } from "@/lib/data/clientAccess";
import { requireCurrentUser, senderFirstName } from "@/lib/currentUser";
import { mentionOptions } from "@/lib/mentions";
import { activateClient, archiveClient, setClientColor } from "@/app/(app)/clients/actions";
import { Card } from "@/components/ui/Card";
import { PanelHeading } from "@/components/ui/PanelHeading";
import { RecordSectionTabs, type SectionTab } from "@/components/ui/RecordSectionTabs";
import { BackLink } from "@/components/ui/BackLink";
import { ClientStatusBadge, Badge } from "@/components/ui/Badge";
import { EntityColorPicker } from "@/components/ui/EntityColorPicker";
import { ClientForm } from "@/components/clients/ClientForm";
import { ClientLinks } from "@/components/clients/ClientLinks";
import { InvoicesList } from "@/components/clients/InvoicesList";
import { FollowUpsList } from "@/components/FollowUpsList";
import { DeleteClientButton } from "@/components/clients/DeleteClientButton";
import { MeetingNotesSection } from "@/components/MeetingNotesSection";
import { EmailSection } from "@/components/EmailSection";
import { DocumentsSection } from "@/components/DocumentsSection";
import { CostSummarySection } from "@/components/CostSummarySection";
import { UnbilledHoursPanel } from "@/components/tracker/UnbilledHoursPanel";
import { ScopedTaskList } from "@/components/ScopedTaskList";
import { NotesLog } from "@/components/NotesLog";
import { formatCurrency, isDateInRange } from "@/lib/format";
import { listWorkTypes } from "@/lib/data/workTypes";
import { getBusinessToday } from "@/lib/data/businesses";
import { Button } from "@/components/ui/Button";
import { buildAssignOptions, selfId } from "@/lib/assign";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ costFrom?: string; costTo?: string }>;
}) {
  const { id } = await params;
  const { costFrom, costTo } = await searchParams;
  const user = await requireCurrentUser();
  const isOwner = user.role === "OWNER";
  if (!isOwner) {
    const accessibleClientIds = await accessibleClientIdsFor(user);
    if (!accessibleClientIds?.includes(id)) notFound();
  }
  const [client, costEntries, unbilledEntries, workTypes, today, teamMembers, workCategories, allClients, leads, clientAccessMap] =
    await Promise.all([
      getClient(id, user.businessId),
      isOwner
        ? listCostEntries(user.businessId, { clientId: id, dateFrom: costFrom, dateTo: costTo })
        : Promise.resolve([]),
      // Not scoped by the costFrom/costTo report filter — old unbilled hours should still show up here to be invoiced even if the current date filter excludes them.
      isOwner ? listUnbilledTimeEntries(user.businessId, id) : Promise.resolve([]),
      listWorkTypes(user.businessId, { includeInactive: true }),
      getBusinessToday(user.businessId),
      // Needed for follow-up assignment (all roles), not just the owner-only Cost & Profitability section below.
      listTeamMembers(user.businessId),
      isOwner ? listWorkCategories(user.businessId) : Promise.resolve([]),
      isOwner ? listClients(user.businessId) : Promise.resolve([]),
      isOwner ? listLeads(user.businessId) : Promise.resolve([]),
      listAllClientAccess(user.businessId),
    ]);
  if (!client) notFound();

  // Who can be @mentioned on this client's notes — only team members who
  // already have access to it, so a mention notification always links
  // somewhere the recipient can actually open.
  const accessTeamMemberIds = Object.entries(clientAccessMap)
    .filter(([, clientIds]) => clientIds.includes(id))
    .map(([teamMemberId]) => teamMemberId);
  const noteMentionOptions = mentionOptions(
    user,
    teamMembers.filter((t) => t.hasLogin),
    accessTeamMemberIds
  );

  // Every to-do board is private — a client's Tasks panel only ever shows
  // the current viewer's own to-dos for that client, never a colleague's.
  const selfAssigneeId = user.role === "TEAM_MEMBER" ? user.teamMember.id : null;
  const myTasks = client.tasks.filter((t) => t.assignedToTeamMemberId === selfAssigneeId);
  const assignOptions = buildAssignOptions(user, teamMembers);
  const currentAssigneeId = selfId(user);

  const isArchived = client.status === "CHURNED";
  const boundArchiveClient = archiveClient.bind(null, id);
  const boundActivateClient = activateClient.bind(null, id);
  const owner = { type: "CLIENT" as const, clientId: id };

  // Real invoice totals, not a manually-typed figure — mirrors the same
  // "Invoiced to date"/"Paid to date" stats shown in the Invoices section
  // below, so the sidebar summary always agrees with what's actually there.
  const invoicedToDate = client.invoices
    .filter((i) => i.status !== "NOT_INVOICED")
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const paidToDate = client.invoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const clientSectionTabs: SectionTab[] = [
    {
      key: "follow-ups",
      label: "Tasks & Follow-ups",
      icon: <CalendarClock size={15} />,
      color: "burnt",
      count: client.followUps.length + myTasks.length,
      content: (
        <>
          <div>
            <h4 className="mb-3 font-heading text-base font-bold text-navy-900">Your tasks</h4>
            <ScopedTaskList owner={owner} tasks={myTasks} today={today} />
          </div>
          <div className="mt-8 border-t-2 border-navy-100 pt-6">
            <h4 className="mb-3 font-heading text-base font-bold text-navy-900">Follow-ups</h4>
            <FollowUpsList
              owner={{ clientId: id }}
              followUps={client.followUps}
              today={today}
              assignOptions={assignOptions}
              currentAssigneeId={currentAssigneeId}
            />
          </div>
        </>
      ),
    },
    {
      key: "meetings-notes",
      label: "Meeting Notes",
      icon: <NotebookPen size={15} />,
      color: "violet",
      count: client.meetingNotes.length,
      content: (
        <MeetingNotesSection
          owner={owner}
          notes={client.meetingNotes}
          today={today}
          senderFirstName={senderFirstName(user)}
          defaultTimezone={user.business.timezone}
        />
      ),
    },
    {
      key: "documents",
      label: "Documents & Links",
      icon: <FileText size={15} />,
      color: "blue",
      count: client.documents.length + client.links.length,
      content: (
        <>
          <div>
            <h4 className="mb-3 font-heading text-base font-bold text-navy-900">Documents</h4>
            <DocumentsSection owner={{ clientId: id }} documents={client.documents} />
          </div>
          <div className="mt-8 border-t-2 border-navy-100 pt-6">
            <h4 className="mb-3 font-heading text-base font-bold text-navy-900">Links</h4>
            <ClientLinks clientId={id} links={client.links} />
          </div>
        </>
      ),
    },
    {
      key: "discussion-notes",
      label: "Notes & Activity",
      icon: <StickyNote size={15} />,
      color: "slate",
      count: client.notes.length,
      content: <NotesLog notes={client.notes} kind="client" entityId={id} mentionables={noteMentionOptions} />,
    },
    ...(isOwner
      ? [
          {
            key: "finance",
            label: "Finance",
            icon: <DollarSign size={15} />,
            color: "gold" as const,
            count: client.invoices.length + costEntries.length,
            content: (
              <>
                <div>
                  <h4 className="mb-3 font-heading text-base font-bold text-navy-900">Invoices</h4>
                  <p className="text-sm text-navy-500 mb-4">
                    {client.type === "RECURRING"
                      ? "One entry per month, created automatically — add one-off invoices any time."
                      : "Split the project total across deposits, milestones, or however you invoice this client."}
                  </p>
                  <InvoicesList clientId={id} invoices={client.invoices} defaultHourlyRate={Number(client.hourlyRate ?? 0)} />
                </div>
                {unbilledEntries.length > 0 && (
                  <div className="mt-8 border-t-2 border-navy-100 pt-6">
                    <UnbilledHoursPanel clientId={id} entries={unbilledEntries} defaultRate={client.hourlyRate} />
                  </div>
                )}
                <div className="mt-8 border-t-2 border-navy-100 pt-6">
                  <h4 className="mb-3 font-heading text-base font-bold text-navy-900">
                    Cost &amp; Profitability
                  </h4>
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
                </div>
              </>
            ),
          },
        ]
      : []),
  ];

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
        <div className="flex flex-col items-end gap-2">
          <form action={isArchived ? boundActivateClient : boundArchiveClient}>
            <Button variant={isArchived ? "primary" : "secondary"} size="sm" type="submit">
              {isArchived ? "Activate client" : "Archive client"}
            </Button>
          </form>
          {isOwner && isArchived && <DeleteClientButton clientId={id} companyName={client.companyName} />}
        </div>
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
        </div>

        <div className="space-y-6">
          {isOwner && (
            <Card className="p-6">
              <PanelHeading icon={DollarSign} tone="sage" title="Revenue" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-navy-500">Invoiced to date</p>
                  <p className="font-heading text-xl text-navy-900 mt-0.5">{formatCurrency(invoicedToDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-navy-500">Paid to date</p>
                  <p className="font-heading text-xl text-navy-900 mt-0.5">{formatCurrency(paidToDate)}</p>
                </div>
              </div>
            </Card>
          )}

          <EmailSection
            contactEmail={client.contactEmail}
            contactName={client.contactName}
            companyName={client.companyName}
          />
        </div>
      </div>

      <div className="mt-6">
        <RecordSectionTabs storageKey="record-detail" tabs={clientSectionTabs} />
      </div>
    </div>
  );
}
