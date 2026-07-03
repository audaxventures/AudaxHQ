import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { listMeetingNotes } from "@/lib/data/meetingnotes";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

export default async function MeetingNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ owner?: string }>;
}) {
  const { owner } = await searchParams;
  const allNotes = await listMeetingNotes();
  const notes = allNotes.filter((n) => {
    if (owner === "client") return Boolean(n.clientId);
    if (owner === "lead") return Boolean(n.leadId);
    return true;
  });

  return (
    <div>
      <PageHeader
        eyebrow="Meeting Notes"
        title="Meeting Notes"
        description="Everything discussed with clients and leads, in one place."
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
        <Card className="divide-y divide-navy-100 overflow-hidden">
          {notes.map((note) => {
            const href = note.clientId ? `/clients/${note.clientId}` : `/leads/${note.leadId}`;
            return (
              <Link
                key={note.id}
                href={href}
                className="block px-5 py-4 hover:bg-cream-100/60 transition-colors"
              >
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <p className="font-heading text-base font-medium text-navy-900">{note.ownerName}</p>
                  <Badge tone={note.clientId ? "navy" : "burnt"}>
                    {note.clientId ? "Client" : "Lead"}
                  </Badge>
                  <span className="text-xs text-navy-400">{formatDate(note.meetingDate)}</span>
                </div>
                {note.attendees && (
                  <p className="flex items-center gap-1 text-xs text-navy-400 mb-1.5">
                    <Users size={12} /> {note.attendees}
                  </p>
                )}
                <p className="text-sm text-navy-700 line-clamp-2">{note.notes}</p>
              </Link>
            );
          })}
        </Card>
      )}
    </div>
  );
}
