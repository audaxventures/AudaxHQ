"use client";

import { useState } from "react";
import { ChevronRight, Folder, Lock, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { RichTextView } from "@/components/ui/RichTextEditor";
import { formatDate, formatDateInput, formatMonthYear } from "@/lib/format";
import { entityColorChipClass } from "@/lib/avatar";
import { cn } from "@/lib/cn";
import type { MeetingNote, NoteFolder } from "@/lib/types";
import { MeetingNoteDetailModal } from "@/components/meetingnotes/MeetingNoteDetailModal";
import { folderHue, hueFor } from "@/components/meetingnotes/noteColors";

/** Notes arrive already sorted by date (either direction), so consecutive same-month runs group cleanly without re-sorting. */
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

const OWNER_KIND = (note: MeetingNote) => (note.clientId ? "Client" : note.leadId ? "Lead" : "Partner");

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
  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;
  const groups = groupByMonth(notes);
  const foldersById = new Map((organize?.folders ?? []).map((f) => [f.id, f]));

  return (
    <>
      <div className="space-y-7">
        {groups.map((group) => (
          <section key={group.month}>
            <div className="mb-2 flex items-baseline gap-2 px-1">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-navy-500">
                {formatMonthYear(group.notes[0].meetingDate)}
              </p>
              <span className="text-xs text-navy-300">{group.notes.length}</span>
            </div>
            <Card className="divide-y divide-navy-100/80 overflow-hidden bg-white">
              {group.notes.map((note) => {
                const folder = note.folderId ? foldersById.get(note.folderId) : undefined;
                const preview = note.notes ?? note.agenda ?? "";
                return (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => setSelectedId(note.id)}
                    className="group flex w-full cursor-pointer items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-cream-50 sm:px-5"
                  >
                    {note.isPrivate ? (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-teal-100 text-teal-600">
                        <Lock size={15} />
                      </span>
                    ) : (
                      <AvatarChip name={note.ownerName ?? "?"} color={note.ownerColor} className="h-9 w-9" />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="line-clamp-2 font-heading text-[15px] font-medium text-navy-900 group-hover:text-burnt-700 sm:line-clamp-1">
                          {note.title ?? note.ownerName ?? "Untitled note"}
                        </p>
                        <span className="shrink-0 text-xs tabular-nums text-navy-400">{formatDate(note.meetingDate)}</span>
                      </div>

                      {preview && (
                        <RichTextView html={preview} className="mt-1 text-sm leading-relaxed text-navy-500 line-clamp-2" />
                      )}

                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {note.isPrivate ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-medium text-teal-600">
                            <Lock size={10} /> Private
                          </span>
                        ) : (
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                              entityColorChipClass(note.ownerColor, note.ownerName ?? "?")
                            )}
                            title={OWNER_KIND(note)}
                          >
                            {note.ownerName}
                          </span>
                        )}
                        {folder && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                              folderHue(folder).chip
                            )}
                          >
                            <Folder size={10} /> {folder.name}
                          </span>
                        )}
                        {note.tags?.map((t) => (
                          <span key={t} className={cn("rounded-full px-2 py-0.5 text-[11px]", hueFor(t).chip)}>
                            #{t}
                          </span>
                        ))}
                        {note.attendees && (
                          <span className="inline-flex min-w-0 max-w-[16rem] items-center gap-1 truncate text-[11px] text-navy-400">
                            <Users size={11} className="shrink-0" /> <span className="truncate">{note.attendees}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight
                      size={16}
                      className="mt-2.5 hidden shrink-0 text-navy-300 transition-transform group-hover:translate-x-0.5 group-hover:text-burnt-500 sm:block"
                    />
                  </button>
                );
              })}
            </Card>
          </section>
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
