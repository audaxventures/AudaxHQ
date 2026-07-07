import Link from "next/link";
import { NotebookPen, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { MeetingNotesList } from "@/components/meetingnotes/MeetingNotesList";
import { listMeetingNotes } from "@/lib/data/meetingnotes";
import { accessibleClientIdsFor } from "@/lib/data/clientAccess";
import { getCurrentUser } from "@/lib/currentUser";
import { cn } from "@/lib/cn";

export default async function MeetingNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ owner?: string }>;
}) {
  const { owner } = await searchParams;
  const user = await getCurrentUser();
  const accessibleClientIds = user ? await accessibleClientIdsFor(user) : null;
  const allNotes = await listMeetingNotes({ accessibleClientIds });
  const notes = allNotes.filter((n) => {
    if (owner === "client") return Boolean(n.clientId);
    if (owner === "lead") return Boolean(n.leadId);
    return true;
  });

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
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: undefined, label: "All" },
          { key: "client", label: "Clients" },
          { key: "lead", label: "Leads" },
        ].map((f) => (
          <Link
            key={f.label}
            href={f.key ? `/meeting-notes?owner=${f.key}` : "/meeting-notes"}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors border",
              owner === f.key
                ? "bg-navy-900 text-cream-50 border-navy-900"
                : "bg-transparent text-navy-600 border-navy-200 hover:border-navy-400"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>
      {notes.length === 0 ? (
        <EmptyState
          title="No meeting notes yet"
          description="Log your first meeting note against a client or lead."
          action={<LinkButton href="/meeting-notes/new">Add a meeting note</LinkButton>}
        />
      ) : (
        <MeetingNotesList notes={notes} />
      )}
    </div>
  );
}
