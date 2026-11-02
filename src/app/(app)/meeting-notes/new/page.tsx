import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { NewMeetingNoteForm } from "@/components/meetingnotes/NewMeetingNoteForm";
import { listClients } from "@/lib/data/clients";
import { listLeads } from "@/lib/data/leads";
import { listTodoTypes } from "@/lib/data/todoTypes";
import { listNoteFolders, listNoteTagNames } from "@/lib/data/meetingnotes";
import { accessibleClientIdsFor } from "@/lib/data/clientAccess";
import { requireCurrentUser } from "@/lib/currentUser";
import { todayDateStr } from "@/lib/calendarGrid";

export default async function NewMeetingNotePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const user = await requireCurrentUser();
  const me = user.role === "TEAM_MEMBER" ? user.teamMember.id : null;
  const accessibleClientIds = await accessibleClientIdsFor(user);
  const [clients, leads, folders, knownTags, todoTypes] = await Promise.all([
    listClients(user.businessId, { accessibleClientIds }),
    listLeads(user.businessId),
    listNoteFolders(user.businessId, me),
    listNoteTagNames(user.businessId, me),
    listTodoTypes(user.businessId),
  ]);
  const defaultFolderId = folders.some((f) => f.id === sp.folder) ? sp.folder : null;

  return (
    <div>
      <PageHeader
        eyebrow="Notes"
        title="New note"
        description="Write a private note, or log a meeting with a client or lead."
      />
      <Card className="p-6 max-w-3xl">
        <NewMeetingNoteForm
          clients={clients.map((c) => ({ id: c.id, companyName: c.companyName }))}
          leads={leads.map((l) => ({ id: l.id, companyName: l.companyName }))}
          defaultTimezone={user.business.timezone}
          folders={folders}
          knownTags={knownTags}
          todoTypes={todoTypes.map((t) => ({ id: t.id, name: t.name }))}
          today={todayDateStr(user.business.timezone)}
          defaultFolderId={defaultFolderId}
        />
      </Card>
    </div>
  );
}
