import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { NewMeetingNoteForm } from "@/components/meetingnotes/NewMeetingNoteForm";
import { listClients } from "@/lib/data/clients";
import { listLeads } from "@/lib/data/leads";
import { accessibleClientIdsFor } from "@/lib/data/clientAccess";
import { requireCurrentUser } from "@/lib/currentUser";

export default async function NewMeetingNotePage() {
  const user = await requireCurrentUser();
  const accessibleClientIds = await accessibleClientIdsFor(user);
  const [clients, leads] = await Promise.all([
    listClients(user.businessId, { accessibleClientIds }),
    listLeads(user.businessId),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Meeting Notes"
        title="New meeting note"
        description="Pick who the meeting was with, then log what was discussed."
      />
      <Card className="p-6 max-w-2xl">
        <NewMeetingNoteForm
          clients={clients.map((c) => ({ id: c.id, companyName: c.companyName }))}
          leads={leads.map((l) => ({ id: l.id, companyName: l.companyName }))}
        />
      </Card>
    </div>
  );
}
