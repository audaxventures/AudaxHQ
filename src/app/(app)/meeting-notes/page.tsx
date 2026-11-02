import Link from "next/link";
import { NotebookPen, Plus, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MeetingNotesFilters } from "@/components/meetingnotes/MeetingNotesFilters";
import { MeetingNotesList } from "@/components/meetingnotes/MeetingNotesList";
import { NotesSidebar, type NotesView } from "@/components/meetingnotes/NotesSidebar";
import { listMeetingNotes, listNoteFolders, noteViewerFor } from "@/lib/data/meetingnotes";
import { listClients } from "@/lib/data/clients";
import { listLeads } from "@/lib/data/leads";
import { listTodoTypes } from "@/lib/data/todoTypes";
import { requireCurrentUser, senderFirstName } from "@/lib/currentUser";
import { toPlainText } from "@/lib/richtext";
import type { MeetingNote } from "@/lib/types";

const VIEWS: NotesView[] = ["all", "private", "unfiled", "clients", "leads", "partners"];

const VIEW_TITLES: Record<NotesView, string> = {
  all: "All notes",
  private: "Private notes",
  unfiled: "Unfiled notes",
  clients: "Client notes",
  leads: "Lead notes",
  partners: "Partner notes",
};

function matchesView(note: MeetingNote, view: NotesView): boolean {
  switch (view) {
    case "private":
      return note.isPrivate;
    case "unfiled":
      return !note.folderId;
    case "clients":
      return !!note.clientId;
    case "leads":
      return !!note.leadId;
    case "partners":
      return !!note.partnerId;
    default:
      return true;
  }
}

export default async function MeetingNotesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const user = await requireCurrentUser();
  const viewer = await noteViewerFor(user);

  const [allNotes, folders, clients, leads, todoTypes] = await Promise.all([
    listMeetingNotes(user.businessId, {
      viewer,
      accessibleClientIds: viewer.accessibleClientIds,
      includePartnerOwned: viewer.canSeePartners,
    }),
    listNoteFolders(user.businessId, viewer.teamMemberId),
    listClients(user.businessId, { accessibleClientIds: viewer.accessibleClientIds }),
    listLeads(user.businessId, { converted: "include" }),
    listTodoTypes(user.businessId),
  ]);

  const folder = folders.find((f) => f.id === sp.folder) ?? null;
  const view: NotesView = folder ? "all" : VIEWS.includes(sp.view as NotesView) ? (sp.view as NotesView) : "all";
  const selectedTags = (sp.tag ?? "").split(",").filter(Boolean);
  const search = (sp.q ?? "").trim().toLowerCase();

  // Picking a top-level folder shows its subfolders' notes too.
  const folderScope = (id: string) => new Set([id, ...folders.filter((f) => f.parentId === id).map((f) => f.id)]);

  const counts = {
    views: Object.fromEntries(VIEWS.map((v) => [v, allNotes.filter((n) => matchesView(n, v)).length])) as Record<NotesView, number>,
    folders: Object.fromEntries(
      folders.map((f) => {
        const scope = folderScope(f.id);
        return [f.id, allNotes.filter((n) => n.folderId && scope.has(n.folderId)).length];
      })
    ),
    tags: Array.from(
      allNotes
        .flatMap((n) => n.tags ?? [])
        .reduce((m, t) => m.set(t, (m.get(t) ?? 0) + 1), new Map<string, number>())
    )
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };

  let notes = allNotes.filter((n) => matchesView(n, view));
  if (folder) {
    const scope = folderScope(folder.id);
    notes = notes.filter((n) => n.folderId && scope.has(n.folderId));
  }
  if (selectedTags.length) notes = notes.filter((n) => selectedTags.every((t) => n.tags?.includes(t)));
  if (sp.clientId) notes = notes.filter((n) => n.clientId === sp.clientId);
  if (sp.leadId) notes = notes.filter((n) => n.leadId === sp.leadId);
  if (search) {
    notes = notes.filter((n) => {
      const haystack = [n.title, n.attendees, n.ownerName, toPlainText(n.notes), toPlainText(n.agenda), ...(n.tags ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }

  const current: Record<string, string | undefined> = {
    view: folder ? undefined : sp.view,
    folder: folder?.id,
    tag: sp.tag,
    clientId: sp.clientId,
    leadId: sp.leadId,
    q: sp.q,
  };
  const parentFolder = folder?.parentId ? folders.find((f) => f.id === folder.parentId) : null;
  const heading = folder ? (parentFolder ? `${parentFolder.name} / ${folder.name}` : folder.name) : VIEW_TITLES[view];
  const newNoteHref = folder ? `/meeting-notes/new?folder=${folder.id}` : "/meeting-notes/new";
  const knownTags = counts.tags.map((t) => t.name);

  function hrefWithout(tag: string) {
    const params = new URLSearchParams();
    const rest = selectedTags.filter((t) => t !== tag).join(",");
    for (const [k, v] of Object.entries({ ...current, tag: rest || undefined })) if (v) params.set(k, v);
    const qs = params.toString();
    return qs ? `/meeting-notes?${qs}` : "/meeting-notes";
  }

  return (
    <div>
      <PageHeader
        icon={NotebookPen}
        tone="slate"
        eyebrow="Notes"
        title="Notes"
        description="Meeting notes, board notes, and anything else — filed in folders and tags"
        action={
          <LinkButton href={newNoteHref}>
            <Plus size={16} /> New note
          </LinkButton>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Card className="p-3">
            <NotesSidebar folders={folders} counts={counts} current={current} showPartners={viewer.canSeePartners} />
          </Card>
        </aside>

        <div className="min-w-0">
          <Card className="mb-6 p-6">
            <MeetingNotesFilters clients={clients} leads={leads} filters={current} />
          </Card>

          <div className="mb-3 flex flex-wrap items-center gap-2 px-1">
            <h2 className="font-heading text-lg font-medium text-navy-900">{heading}</h2>
            <span className="text-sm text-navy-400">{notes.length}</span>
            {selectedTags.map((t) => (
              <Link
                key={t}
                href={hrefWithout(t)}
                className="inline-flex items-center gap-1 rounded-full bg-navy-900 px-2.5 py-1 text-xs text-cream-50"
              >
                #{t} <X size={12} />
              </Link>
            ))}
          </div>

          {allNotes.length === 0 ? (
            <EmptyState
              title="No notes yet"
              description="Write a private note for a board or committee, or log a meeting with a client or lead."
              action={<LinkButton href={newNoteHref}>Write a note</LinkButton>}
            />
          ) : notes.length === 0 ? (
            <EmptyState
              title={folder ? "Nothing in this folder yet" : "No matching notes"}
              description={folder ? "File a note here from its edit screen, or start a new one." : "Try a different search or clear the filters."}
              action={folder ? <LinkButton href={newNoteHref}>New note in {folder.name}</LinkButton> : undefined}
            />
          ) : (
            <MeetingNotesList
              notes={notes}
              senderFirstName={senderFirstName(user)}
              defaultTimezone={user.business.timezone}
              organize={{ folders, knownTags }}
              todoTypes={todoTypes.map((t) => ({ id: t.id, name: t.name }))}
              initialSelectedId={sp.note ?? null}
            />
          )}
        </div>
      </div>
    </div>
  );
}
