import Link from "next/link";
import { ChevronRight, Folder, NotebookPen, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MeetingNotesList } from "@/components/meetingnotes/MeetingNotesList";
import { NotesMobileNav, NotesSidebar } from "@/components/meetingnotes/NotesSidebar";
import { NotesToolbar, type OwnerPicker } from "@/components/meetingnotes/NotesToolbar";
import { DATE_RANGES, VIEW_META, notesHref, type DateRange, type NotesView } from "@/components/meetingnotes/notesNav";
import { HUES, VIEW_HUES, folderHue } from "@/components/meetingnotes/noteColors";
import { listMeetingNotes, listNoteFolders, noteViewerFor } from "@/lib/data/meetingnotes";
import { listTodoTypes } from "@/lib/data/todoTypes";
import { requireCurrentUser, senderFirstName } from "@/lib/currentUser";
import { todayDateStr } from "@/lib/calendarGrid";
import { formatDateInput } from "@/lib/format";
import { toPlainText } from "@/lib/richtext";
import { cn } from "@/lib/cn";
import type { MeetingNote } from "@/lib/types";

const VIEWS: NotesView[] = ["all", "private", "unfiled", "clients", "leads", "partners"];

const VIEW_TITLES: Record<NotesView, string> = {
  all: "All notes",
  private: "Private notes",
  unfiled: "Unfiled private notes",
  clients: "Client notes",
  leads: "Lead notes",
  partners: "Partner notes",
};

const VIEW_SUBTITLES: Record<NotesView, string> = {
  all: "Everything you can see, newest first",
  private: "Only you can see these",
  unfiled: "Private notes that aren't in a folder yet",
  clients: "Meeting notes logged against your clients",
  leads: "Meeting notes logged against your leads",
  partners: "Meeting notes logged against your partners",
};

const EMPTY: Record<NotesView, { title: string; description: string }> = {
  all: { title: "No notes yet", description: "Write a private note for a board or committee, or log a meeting with a client or lead." },
  private: { title: "No private notes yet", description: "Private notes are only visible to you — perfect for boards, committees and ideas." },
  unfiled: { title: "All sorted", description: "Every private note is in a folder." },
  clients: { title: "No client notes yet", description: "Log a meeting from a client's page, or start one with New note." },
  leads: { title: "No lead notes yet", description: "Log a meeting from a lead's page, or start one with New note." },
  partners: { title: "No partner notes yet", description: "Log a meeting from a partner's page." },
};

function matchesView(note: MeetingNote, view: NotesView): boolean {
  switch (view) {
    case "private":
      return note.isPrivate;
    case "unfiled":
      // Private notes still to sort — client/lead/partner notes are already
      // organized under their own views, so they never count as unfiled.
      return note.isPrivate && !note.folderId;
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

/** Inclusive [from, to] YYYY-MM-DD bounds for a date-range filter, in the workspace's timezone. */
function rangeBounds(range: DateRange, today: string): [string, string] {
  const shift = (days: number) => {
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - days);
    return d.toISOString().slice(0, 10);
  };
  const year = Number(today.slice(0, 4));
  switch (range) {
    case "30d":
      return [shift(30), today];
    case "90d":
      return [shift(90), today];
    case "year":
      return [`${year}-01-01`, `${year}-12-31`];
    case "lastyear":
      return [`${year - 1}-01-01`, `${year - 1}-12-31`];
  }
}

/** Unique client/lead/partner names among these notes — the picker only offers ones that actually have notes. */
function ownerOptions(notes: MeetingNote[], key: "clientId" | "leadId" | "partnerId") {
  const map = new Map<string, string>();
  for (const n of notes) {
    const id = n[key];
    if (id && !map.has(id)) map.set(id, n.ownerName ?? "Unnamed");
  }
  return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
}

export default async function MeetingNotesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const user = await requireCurrentUser();
  const viewer = await noteViewerFor(user);

  const [allNotes, folders, todoTypes] = await Promise.all([
    listMeetingNotes(user.businessId, {
      viewer,
      accessibleClientIds: viewer.accessibleClientIds,
      includePartnerOwned: viewer.canSeePartners,
    }),
    listNoteFolders(user.businessId, viewer.teamMemberId),
    listTodoTypes(user.businessId),
  ]);

  const folder = folders.find((f) => f.id === sp.folder) ?? null;
  const parentFolder = folder?.parentId ? (folders.find((f) => f.id === folder.parentId) ?? null) : null;
  const requestedView = VIEWS.includes(sp.view as NotesView) ? (sp.view as NotesView) : "all";
  const view: NotesView = folder ? "all" : requestedView === "partners" && !viewer.canSeePartners ? "all" : requestedView;
  const selectedTags = (sp.tag ?? "").split(",").filter(Boolean);
  const search = (sp.q ?? "").trim().toLowerCase();
  const range = sp.range && sp.range in DATE_RANGES ? (sp.range as DateRange) : null;

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

  // The tab's own notes, before any toolbar filters — also feeds its picker.
  let tabNotes = allNotes.filter((n) => matchesView(n, view));
  if (folder) {
    const scope = folderScope(folder.id);
    tabNotes = tabNotes.filter((n) => n.folderId && scope.has(n.folderId));
  }

  const picker: OwnerPicker | undefined =
    !folder && view === "clients"
      ? { param: "clientId", label: "Client", options: ownerOptions(tabNotes, "clientId") }
      : !folder && view === "leads"
        ? { param: "leadId", label: "Lead", options: ownerOptions(tabNotes, "leadId") }
        : !folder && view === "partners"
          ? { param: "partnerId", label: "Partner", options: ownerOptions(tabNotes, "partnerId") }
          : undefined;

  let notes = tabNotes;
  if (picker && sp[picker.param]) notes = notes.filter((n) => n[picker.param] === sp[picker.param]);
  if (selectedTags.length) notes = notes.filter((n) => selectedTags.every((t) => n.tags?.includes(t)));
  if (range) {
    const [from, to] = rangeBounds(range, todayDateStr(user.business.timezone));
    notes = notes.filter((n) => {
      const d = formatDateInput(n.meetingDate);
      return d >= from && d <= to;
    });
  }
  if (search) {
    notes = notes.filter((n) => {
      const haystack = [n.title, n.attendees, n.ownerName, toPlainText(n.notes), toPlainText(n.agenda), ...(n.tags ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }
  if (sp.sort === "oldest") notes = [...notes].reverse();

  const current: Record<string, string | undefined> = {
    view: folder ? undefined : sp.view,
    folder: folder?.id,
    tag: sp.tag,
    clientId: picker?.param === "clientId" ? sp.clientId : undefined,
    leadId: picker?.param === "leadId" ? sp.leadId : undefined,
    partnerId: picker?.param === "partnerId" ? sp.partnerId : undefined,
    q: sp.q,
    range: range ?? undefined,
    sort: sp.sort === "oldest" ? "oldest" : undefined,
  };
  const activeView = folder ? null : view;
  const newNoteHref = folder ? `/meeting-notes/new?folder=${folder.id}` : "/meeting-notes/new";
  const knownTags = counts.tags.map((t) => t.name);

  const headingHue = folder ? folderHue(folder) : HUES[VIEW_HUES[view]];
  const HeadingIcon = folder ? Folder : VIEW_META[view].icon;
  const empty = folder
    ? { title: "Nothing in this folder yet", description: "File a note here from its edit screen, or start a new one." }
    : EMPTY[view];

  return (
    <div>
      <PageHeader
        icon={NotebookPen}
        tone="burnt"
        eyebrow="Notes"
        title="Notes"
        description="Meeting notes, board notes, and everything in between"
        action={
          <LinkButton href={newNoteHref}>
            <Plus size={16} /> New note
          </LinkButton>
        }
      />

      <div className="mb-5 lg:hidden">
        <NotesMobileNav
          folders={folders}
          counts={counts}
          current={current}
          activeView={activeView}
          showPartners={viewer.canSeePartners}
          activeFolderName={folder ? (parentFolder ? `${parentFolder.name} › ${folder.name}` : folder.name) : null}
          activeFolderColorClass={folder ? folderHue(folder).text : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="hidden lg:sticky lg:top-6 lg:block lg:self-start">
          <Card className="bg-white p-3">
            <NotesSidebar
              folders={folders}
              counts={counts}
              current={current}
              activeView={activeView}
              showPartners={viewer.canSeePartners}
            />
          </Card>
        </aside>

        <div className="min-w-0">
          <Card className="mb-6 overflow-hidden bg-white">
            <div className={cn("h-1", headingHue.solid)} />
            <div className="space-y-4 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", headingHue.soft, headingHue.text)}>
                  <HeadingIcon size={18} />
                </span>
                <div className="min-w-0">
                  <h2 className="flex flex-wrap items-center gap-1.5 font-heading text-xl font-medium text-navy-900">
                    {parentFolder && (
                      <>
                        <Link
                          href={notesHref(current, { folder: parentFolder.id, view: undefined })}
                          className="text-navy-400 hover:text-navy-700"
                        >
                          {parentFolder.name}
                        </Link>
                        <ChevronRight size={16} className="text-navy-300" />
                      </>
                    )}
                    <span className="truncate">{folder ? folder.name : VIEW_TITLES[view]}</span>
                    <span className={cn("rounded-full px-2 text-xs font-sans font-medium leading-5", headingHue.chip)}>
                      {notes.length}
                    </span>
                  </h2>
                  <p className="text-sm text-navy-400">
                    {folder ? (parentFolder ? "Subfolder" : "Includes notes in its subfolders") : VIEW_SUBTITLES[view]}
                  </p>
                </div>
              </div>
              <NotesToolbar key={`${current.view ?? ""}|${current.folder ?? ""}`} current={current} picker={picker} />
            </div>
          </Card>

          {tabNotes.length === 0 ? (
            <EmptyState
              title={empty.title}
              description={empty.description}
              action={
                view === "unfiled" && !folder ? undefined : (
                  <LinkButton href={newNoteHref}>{folder ? `New note in ${folder.name}` : "Write a note"}</LinkButton>
                )
              }
            />
          ) : notes.length === 0 ? (
            <EmptyState title="No matching notes" description="Try a different search, date range or tag." />
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
