"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Paperclip, CheckCircle2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Input, Label, FieldGroup, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { sendMeetingNoteEmail, type SendMeetingNoteEmailState } from "@/lib/actions/meetingnotes";
import { formatDate } from "@/lib/format";
import { meetingNotePdfFilename } from "@/lib/pdf/filename";
import type { MeetingNote } from "@/lib/types";

const initialState: SendMeetingNoteEmailState = { success: false, error: null };

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Sending…" : "Send"}
    </Button>
  );
}

export function MeetingNoteEmailDrawer({
  note,
  senderFirstName,
  onClose,
}: {
  note: MeetingNote;
  senderFirstName: string;
  onClose: () => void;
}) {
  const [state, formAction] = useActionState(sendMeetingNoteEmail, initialState);
  const greetingName = (note.ownerContactName ?? note.ownerName ?? "").trim().split(/\s+/)[0] || "there";
  const defaultSubject = `Notes from our meeting on ${formatDate(note.meetingDate)}`;
  const defaultBody = `Hi ${greetingName},\n\nAttached are the notes from our meeting on ${formatDate(note.meetingDate)}. Let me know if you have any questions.\n\nBest,\n${senderFirstName}`;

  if (state.success) {
    return (
      <Drawer title="Email meeting notes" onClose={onClose}>
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <CheckCircle2 size={40} className="text-sage-600" />
          <p className="font-heading text-lg font-medium text-navy-900">Sent to {note.ownerEmail}</p>
          <p className="text-sm text-navy-500">A copy was also sent to your own inbox.</p>
          <Button type="button" variant="secondary" size="sm" onClick={onClose} className="mt-2">
            Close
          </Button>
        </div>
      </Drawer>
    );
  }

  return (
    <Drawer title="Email meeting notes" description={`To ${note.ownerEmail}`} onClose={onClose}>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="noteId" value={note.id} />
        <FieldGroup>
          <Label htmlFor="email-subject">Subject</Label>
          <Input id="email-subject" name="subject" defaultValue={defaultSubject} required />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="email-body">Message</Label>
          <Textarea id="email-body" name="bodyText" rows={8} defaultValue={defaultBody} required />
        </FieldGroup>
        <div className="flex items-center gap-2 rounded-lg border border-navy-100 bg-cream-100/50 px-3 py-2.5 text-sm text-navy-600">
          <Paperclip size={15} className="shrink-0 text-navy-400" />
          <span className="truncate">{meetingNotePdfFilename(note)}</span>
        </div>
        {state.error && (
          <p className="text-sm text-brick-600" role="alert">
            {state.error}
          </p>
        )}
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <SendButton />
        </div>
      </form>
    </Drawer>
  );
}
