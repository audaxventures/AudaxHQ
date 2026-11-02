import { PageHeader } from "@/components/ui/PageHeader";
import { BackLink } from "@/components/ui/BackLink";
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
  // A folder with subfolders can't hold notes, so don't preselect it — the picker shows its subfolders instead.
  const defaultFolderId =
    folders.some((f) => f.id === sp.folder) && !folders.some((f) => f.parentId === sp.folder) ? sp.folder : null;

  // Back/Cancel return to the folder this was opened from, if any.
  const backHref = folders.some((f) => f.id === sp.folder) ? `/meeting-notes?folder=${sp.folder}` : "/meeting-notes";

  return (
    <div>
      <BackLink href={backHref} label="Back to notes" />
      <PageHeader
        eyebrow="Notes"
        title="New note"
        description="Capture a private note, or log a meeting with a client or lead."
      />
      <NewMeetingNoteForm
        clients={clients.map((c) => ({ id: c.id, companyName: c.companyName }))}
        leads={leads.map((l) => ({ id: l.id, companyName: l.companyName }))}
        defaultTimezone={user.business.timezone}
        folders={folders}
        knownTags={knownTags}
        todoTypes={todoTypes.map((t) => ({ id: t.id, name: t.name }))}
        today={todayDateStr(user.business.timezone)}
        defaultFolderId={defaultFolderId}
        cancelHref={backHref}
      />
    </div>
  );
}
