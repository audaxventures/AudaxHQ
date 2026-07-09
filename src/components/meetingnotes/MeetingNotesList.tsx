"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { Badge } from "@/components/ui/Badge";
import { RichTextView } from "@/components/ui/RichTextEditor";
import { formatDate } from "@/lib/format";
import { entityColorClass } from "@/lib/avatar";
import { cn } from "@/lib/cn";
import type { MeetingNote } from "@/lib/types";
import { MeetingNoteDetailModal } from "@/components/meetingnotes/MeetingNoteDetailModal";

export function MeetingNotesList({ notes }: { notes: MeetingNote[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;

  return (
    <>
      <Card tone="slate" className="divide-y divide-navy-100 overflow-hidden">
        {notes.map((note) => (
          <button
            key={note.id}
            type="button"
            onClick={() => setSelectedId(note.id)}
            className="relative flex w-full items-start gap-4 py-4 pl-6 pr-5 text-left hover:bg-cream-100/60 transition-colors cursor-pointer"
          >
            <span
              className={cn(
                "absolute inset-y-0 left-0 w-1.5",
                entityColorClass(note.ownerColor, note.ownerName ?? "?")
              )}
            />
            <AvatarChip name={note.ownerName ?? "?"} color={note.ownerColor} className="mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <p className="font-heading text-base font-medium text-navy-900">{note.title ?? note.ownerName}</p>
                {note.title && <Badge tone={note.clientId ? "sage" : "violet"}>{note.ownerName}</Badge>}
                <span className="text-xs text-navy-400">{formatDate(note.meetingDate)}</span>
              </div>
              {note.attendees && (
                <p className="flex items-center gap-1 text-xs text-navy-400 mb-1.5">
                  <Users size={12} /> {note.attendees}
                </p>
              )}
              <RichTextView html={note.notes ?? note.agenda ?? ""} className="text-sm text-navy-700 line-clamp-2" />
            </div>
          </button>
        ))}
      </Card>

      {selectedNote && (
        <MeetingNoteDetailModal note={selectedNote} onClose={() => setSelectedId(null)} />
      )}
    </>
  );
}
