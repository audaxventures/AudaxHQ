import { NotebookPen, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MeetingNotesFilters } from "@/components/meetingnotes/MeetingNotesFilters";
import { MeetingNotesList } from "@/components/meetingnotes/MeetingNotesList";
import { listMeetingNotes } from "@/lib/data/meetingnotes";
import { listClients } from "@/lib/data/clients";
import { listLeads } from "@/lib/data/leads";
import { accessibleClientIdsFor } from "@/lib/data/clientAccess";
import { requireCurrentUser, senderFirstName } from "@/lib/currentUser";
import { toPlainText } from "@/lib/richtext";

export default async function MeetingNotesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const user = await requireCurrentUser();
  const accessibleClientIds = await accessibleClientIdsFor(user);

  const filters = {
    clientId: sp.clientId || undefined,
    leadId: sp.leadId || undefined,
  };
  const search = (sp.q ?? "").trim().toLowerCase();

  const [allNotes, clients, leads] = await Promise.all([
    listMeetingNotes(user.businessId, { ...filters, accessibleClientIds }),
    listClients(user.businessId, { accessibleClientIds }),
    listLeads(user.businessId, { converted: "include" }),
  ]);

  let notes = allNotes;
  if (search) {
    notes = notes.filter((n) => {
      const haystack = [n.title, n.attendees, n.ownerName, toPlainText(n.notes), toPlainText(n.agenda)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }

  const filterParams: Record<string, string | undefined> = {
    clientId: filters.clientId,
    leadId: filters.leadId,
    q: sp.q,
  };

  return (
    <div>
      <PageHeader
        icon={NotebookPen}
        tone="slate"
        eyebrow="Meeting Notes"
        title="Meeting Notes"
        description="Every conversation, captured and organized"
        action={
          <LinkButton href="/meeting-notes/new">
            <Plus size={16} /> New meeting note
          </LinkButton>
        }
      />

      <Card className="mb-6 p-6">
        <MeetingNotesFilters clients={clients} leads={leads} filters={filterParams} />
      </Card>

      {allNotes.length === 0 ? (
        <EmptyState
          title="No meeting notes yet"
          description="Log your first meeting note against a client or lead."
          action={<LinkButton href="/meeting-notes/new">Add a meeting note</LinkButton>}
        />
      ) : notes.length === 0 ? (
        <EmptyState title="No matching meeting notes" description="Try a different search or clear the filters." />
      ) : (
        <MeetingNotesList notes={notes} senderFirstName={senderFirstName(user)} />
      )}
    </div>
  );
}
