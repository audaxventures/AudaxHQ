"use client";

import { useState } from "react";
import { Folder, Lock, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { Badge } from "@/components/ui/Badge";
import { RichTextView } from "@/components/ui/RichTextEditor";
import { formatDate, formatDateInput, formatMonthYear } from "@/lib/format";
import { entityColorClass } from "@/lib/avatar";
import { cn } from "@/lib/cn";
import type { MeetingNote, NoteFolder } from "@/lib/types";
import { MeetingNoteDetailModal } from "@/components/meetingnotes/MeetingNoteDetailModal";

/** Notes arrive sorted by meeting_date desc, so consecutive same-month runs group cleanly without re-sorting. */
function groupByMonth(notes: MeetingNote[]): { month: string; notes: MeetingNote[] }[] {
  const groups: { month: string; notes: MeetingNote[] }[] = [];
  for (const note of notes) {
    const monthKey = formatDateInput(note.meetingDate).slice(0, 7);
    const last = groups[groups.length - 1];
    if (last && last.month === monthKey) {
      last.notes.push(note);
    } else {
      groups.push({ month: monthKey, notes: [note] });
    }
  }
  return groups;
}

export function MeetingNotesList({
  notes,
  senderFirstName,
  defaultTimezone,
  organize,
  todoTypes,
  initialSelectedId,
}: {
  notes: MeetingNote[];
  senderFirstName: string;
  defaultTimezone: string;
  /** The viewer's folders + tag suggestions — enables filing/tagging from the note modal. */
  organize?: { folders: NoteFolder[]; knownTags: string[] };
  todoTypes?: { id: string; name: string }[];
  /** Opens this note straight away (e.g. linked from the calendar). */
  initialSelectedId?: string | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);
  const folderNames = new Map((organize?.folders ?? []).map((f) => [f.id, f.name]));
  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;
  const groups = groupByMonth(notes);

  return (
    <>
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.month}>
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-navy-400">
              {formatMonthYear(group.notes[0].meetingDate)}
            </p>
            <Card tone="slate" className="divide-y divide-navy-100 overflow-hidden">
              {group.notes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => setSelectedId(note.id)}
                  className="relative flex w-full items-start gap-4 py-4 pl-6 pr-5 text-left hover:bg-cream-100/60 transition-colors cursor-pointer"
                >
                  {note.isPrivate ? (
                    <>
                      <span className="absolute inset-y-0 left-0 w-1.5 bg-navy-300" />
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-100 text-navy-500">
                        <Lock size={14} />
                      </span>
                    </>
                  ) : (
                    <>
                      <span
                        className={cn(
                          "absolute inset-y-0 left-0 w-1.5",
                          entityColorClass(note.ownerColor, note.ownerName ?? "?")
                        )}
                      />
                      <AvatarChip name={note.ownerName ?? "?"} color={note.ownerColor} className="mt-0.5" />
                    </>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <p className="font-heading text-base font-medium text-navy-900">
                        {note.title ?? note.ownerName ?? "Untitled note"}
                      </p>
                      {note.title && !note.isPrivate && (
                        <Badge tone={note.clientId ? "sage" : note.leadId ? "violet" : "gold"}>{note.ownerName}</Badge>
                      )}
                      {note.folderId && folderNames.has(note.folderId) && (
                        <span className="inline-flex items-center gap-1 text-xs text-navy-500">
                          <Folder size={12} /> {folderNames.get(note.folderId)}
                        </span>
                      )}
                      <span className="text-xs text-navy-400">{formatDate(note.meetingDate)}</span>
                    </div>
                    {note.attendees && (
                      <p className="flex items-center gap-1 text-xs text-navy-400 mb-1.5">
                        <Users size={12} /> {note.attendees}
                      </p>
                    )}
                    <RichTextView html={note.notes ?? note.agenda ?? ""} className="text-sm text-navy-700 line-clamp-2" />
                    {!!note.tags?.length && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {note.tags.map((t) => (
                          <span key={t} className="rounded-full bg-navy-100 px-2 py-0.5 text-[11px] text-navy-600">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </Card>
          </div>
        ))}
      </div>

      {selectedNote && (
        <MeetingNoteDetailModal
          note={selectedNote}
          onClose={() => setSelectedId(null)}
          senderFirstName={senderFirstName}
          defaultTimezone={defaultTimezone}
          organize={organize}
          todoTypes={todoTypes}
        />
      )}
    </>
  );
}
