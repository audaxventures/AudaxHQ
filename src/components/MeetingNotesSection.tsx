"use client";

import { useRef, useTransition } from "react";
import { Users } from "lucide-react";
import { Input, Textarea, Label, FieldGroup } from "@/components/ui/Field";
import { formatDate } from "@/lib/format";
import type { MeetingNote } from "@/lib/types";
import { createScopedMeetingNote } from "@/lib/actions/meetingnotes";

type Owner = { type: "CLIENT"; clientId: string } | { type: "LEAD"; leadId: string };

export function MeetingNotesSection({ owner, notes }: { owner: Owner; notes: MeetingNote[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();

  return (
    <div>
      <form
        ref={formRef}
        action={(formData) => {
          startTransition(async () => {
            await createScopedMeetingNote(owner, formData);
          });
          formRef.current?.reset();
        }}
        className="space-y-3 mb-5"
      >
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
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={3} placeholder="What was discussed…" required />
        </FieldGroup>
        <button
          type="submit"
          className="rounded-lg bg-navy-900 px-3.5 py-1.5 text-sm font-medium text-cream-50 hover:bg-navy-800 cursor-pointer transition-colors"
        >
          Add meeting note
        </button>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-navy-400">No meeting notes yet.</p>
      ) : (
        <ol className="space-y-4">
          {notes.map((note) => (
            <li key={note.id} className="border-l-2 border-burnt-200 pl-4">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-xs font-medium text-navy-500">{formatDate(note.meetingDate)}</p>
                {note.attendees && (
                  <span className="inline-flex items-center gap-1 text-xs text-navy-400">
                    <Users size={12} /> {note.attendees}
                  </span>
                )}
              </div>
              <p className="text-sm text-navy-800 whitespace-pre-wrap">{note.notes}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
