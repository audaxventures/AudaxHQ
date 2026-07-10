"use client";

import { useRef, useState, useTransition } from "react";
import { Users } from "lucide-react";
import { Input, Label, FieldGroup } from "@/components/ui/Field";
import { RichTextEditor, RichTextView } from "@/components/ui/RichTextEditor";
import { ActionItemsQuickAdd } from "@/components/meetingnotes/ActionItemsQuickAdd";
import { formatDate } from "@/lib/format";
import type { MeetingNote } from "@/lib/types";
import { createScopedMeetingNote } from "@/lib/actions/meetingnotes";
import { MeetingNoteDetailModal } from "@/components/meetingnotes/MeetingNoteDetailModal";

type Owner = { type: "CLIENT"; clientId: string } | { type: "LEAD"; leadId: string };

export function MeetingNotesSection({ owner, notes }: { owner: Owner; notes: MeetingNote[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Bumped after each successful add to force the RichTextEditors to remount
  // and clear — form.reset() doesn't touch contentEditable content.
  const [formKey, setFormKey] = useState(0);
  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;

  return (
    <div>
      <form
        ref={formRef}
        action={(formData) => {
          startTransition(async () => {
            await createScopedMeetingNote(owner, formData);
          });
          formRef.current?.reset();
          setFormKey((k) => k + 1);
        }}
        className="space-y-3 mb-5"
      >
        <FieldGroup>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" placeholder="e.g. Kickoff call, Q3 check-in…" />
        </FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup>
            <Label htmlFor="meetingDate">Meeting date</Label>
            <Input id="meetingDate" name="meetingDate" type="date" required />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="attendees">Attendees</Label>
            <Input id="attendees" name="attendees" placeholder="Jane, Bob…" />
          </FieldGroup>
        </div>
        <FieldGroup>
          <Label htmlFor="agenda">Agenda</Label>
          <RichTextEditor key={`agenda-${formKey}`} id="agenda" name="agenda" rows={2} placeholder="What's planned for this meeting…" />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="notes">Notes</Label>
          <RichTextEditor key={`notes-${formKey}`} id="notes" name="notes" rows={3} placeholder="What was discussed…" />
        </FieldGroup>
        <FieldGroup>
          <Label>Action items</Label>
          <ActionItemsQuickAdd
            key={`actionItems-${formKey}`}
            name="actionItems"
            theirLabel={owner.type === "CLIENT" ? "Client" : "Lead"}
          />
        </FieldGroup>
        <button
          type="submit"
          className="rounded-lg bg-navy-900 px-3.5 py-1.5 text-sm font-medium text-cream-50 hover:bg-navy-800 cursor-pointer transition-colors"
        >
          Save meeting note
        </button>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-navy-400">No meeting notes yet.</p>
      ) : (
        <ol className="space-y-2">
          {notes.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                onClick={() => setSelectedId(note.id)}
                className="w-full border-l-2 border-burnt-200 pl-4 py-1 text-left hover:bg-cream-100/60 transition-colors cursor-pointer rounded-r-md"
              >
                {note.title && <p className="text-sm font-medium text-navy-900">{note.title}</p>}
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-xs font-medium text-navy-500">{formatDate(note.meetingDate)}</p>
                  {note.attendees && (
                    <span className="inline-flex items-center gap-1 text-xs text-navy-400">
                      <Users size={12} /> {note.attendees}
                    </span>
                  )}
                </div>
                <RichTextView html={note.notes ?? note.agenda ?? ""} className="text-sm text-navy-800 line-clamp-3" />
              </button>
            </li>
          ))}
        </ol>
      )}

      {selectedNote && (
        <MeetingNoteDetailModal
          note={selectedNote}
          onClose={() => setSelectedId(null)}
          showOwner={false}
        />
      )}
    </div>
  );
}
