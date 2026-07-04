import { notFound } from "next/navigation";
import { getClient } from "@/lib/data/clients";
import { activateClient, archiveClient } from "@/app/(app)/clients/actions";
import { Card } from "@/components/ui/Card";
import { ClientStatusBadge, Badge } from "@/components/ui/Badge";
import { ClientForm } from "@/components/clients/ClientForm";
import { ClientLinks } from "@/components/clients/ClientLinks";
import { InvoicesList } from "@/components/clients/InvoicesList";
import { FollowUpsList } from "@/components/FollowUpsList";
import { MeetingNotesSection } from "@/components/MeetingNotesSection";
import { ScopedTaskList } from "@/components/ScopedTaskList";
import { NotesLog } from "@/components/NotesLog";
import { formatCurrency } from "@/lib/format";
import { WORK_TYPE_LABELS } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const isArchived = client.status === "CHURNED";
  const boundArchiveClient = archiveClient.bind(null, id);
  const boundActivateClient = activateClient.bind(null, id);
  const owner = { type: "CLIENT" as const, clientId: id };

  return (
    <div>
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
            <ClientStatusBadge status={client.status} />
            <Badge tone="navy">{client.type === "PROJECT" ? "Project-based" : "Recurring"}</Badge>
            {client.workType && (
              <Badge tone="burnt">
                {client.workType === "OTHER" ? client.workTypeOther || "Other" : WORK_TYPE_LABELS[client.workType]}
              </Badge>
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
            <h3 className="font-heading text-lg font-medium text-navy-900 mb-4">Core info</h3>
            <ClientForm key={client.updatedAt} client={client} submitLabel="Save changes" />
          </Card>

          <Card className="p-6">
            <h3 className="font-heading text-lg font-medium text-navy-900 mb-1">Invoices</h3>
            <p className="text-sm text-navy-500 mb-4">
              {client.type === "RECURRING"
                ? "One entry per month, created automatically — add one-off invoices any time."
                : "Split the project total across deposits, milestones, or however you invoice this client."}
            </p>
            <InvoicesList clientId={id} invoices={client.invoices} />
          </Card>

          <Card className="p-6">
            <h3 className="font-heading text-lg font-medium text-navy-900 mb-4">Follow-ups</h3>
            <FollowUpsList owner={{ clientId: id }} followUps={client.followUps} />
          </Card>

          <Card className="p-6">
            <h3 className="font-heading text-lg font-medium text-navy-900 mb-4">Meeting notes</h3>
            <MeetingNotesSection owner={owner} notes={client.meetingNotes} />
          </Card>

          <Card className="p-6">
            <h3 className="font-heading text-lg font-medium text-navy-900 mb-4">
              Activity &amp; notes
            </h3>
            <NotesLog notes={client.notes} kind="client" entityId={id} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-heading text-lg font-medium text-navy-900 mb-1">
              {client.type === "RECURRING" ? "Monthly fee" : "Project total"}
            </h3>
            <p className="font-heading text-2xl text-navy-900">{formatCurrency(client.rate)}</p>
          </Card>

          <Card className="p-6">
            <h3 className="font-heading text-lg font-medium text-navy-900 mb-3">Tasks</h3>
            <ScopedTaskList owner={owner} tasks={client.tasks} />
          </Card>

          <Card className="p-6">
            <h3 className="font-heading text-lg font-medium text-navy-900 mb-3">Links</h3>
            <ClientLinks clientId={id} links={client.links} />
          </Card>
        </div>
      </div>
    </div>
  );
}
