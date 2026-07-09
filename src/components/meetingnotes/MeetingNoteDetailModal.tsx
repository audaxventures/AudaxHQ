"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, FieldGroup } from "@/components/ui/Field";
import { RichTextEditor, RichTextView } from "@/components/ui/RichTextEditor";
import { ActionItemsQuickAdd } from "@/components/meetingnotes/ActionItemsQuickAdd";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { updateMeetingNote } from "@/lib/actions/meetingnotes";
import { setTaskStatus } from "@/lib/actions/tasks";
import { formatDateInput } from "@/lib/format";
import type { MeetingNote } from "@/lib/types";

export function MeetingNoteDetailModal({
  note,
  onClose,
  showOwner = true,
}: {
  note: MeetingNote;
  onClose: () => void;
  /** Hide the owner name/link header when the modal is already opened from that client/lead's own page. */
  showOwner?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [, startToggleTransition] = useTransition();
  const ownerHref = note.clientId ? `/clients/${note.clientId}` : `/leads/${note.leadId}`;

  function toggleActionItem(taskId: string, completed: boolean) {
    startToggleTransition(async () => {
      await setTaskStatus(taskId, note.clientId, note.leadId, completed ? "COMPLETED" : "TO_BE_DONE");
    });
  }

  return (
    <Modal title="Meeting note" onClose={onClose}>
      {showOwner && (
        <div className="mb-5 flex items-center gap-3">
          <AvatarChip name={note.ownerName ?? "?"} color={note.ownerColor} />
          <div className="min-w-0">
            <Link
              href={ownerHref}
              className="font-heading text-base font-medium text-navy-900 hover:underline truncate"
            >
              {note.ownerName}
            </Link>
            <div className="mt-0.5">
              <Badge tone={note.clientId ? "sage" : "violet"}>{note.clientId ? "Client" : "Lead"}</Badge>
            </div>
          </div>
        </div>
      )}

      <form
        action={(formData) => {
          startTransition(async () => {
            await updateMeetingNote(
              note.id,
              { clientId: note.clientId, leadId: note.leadId },
              formData
            );
            onClose();
          });
        }}
        className="space-y-4"
      >
        <FieldGroup>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={note.title ?? ""} placeholder="e.g. Kickoff call, Q3 check-in…" />
        </FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup>
            <Label htmlFor="meetingDate">Meeting date</Label>
            <Input
              id="meetingDate"
              name="meetingDate"
              type="date"
              required
              defaultValue={formatDateInput(note.meetingDate)}
            />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="attendees">Attendees</Label>
            <Input id="attendees" name="attendees" defaultValue={note.attendees ?? ""} placeholder="Jane, Bob…" />
          </FieldGroup>
        </div>
        <FieldGroup>
          <Label htmlFor="agenda">Agenda</Label>
          <RichTextEditor id="agenda" name="agenda" rows={3} defaultValue={note.agenda} placeholder="What's planned for this meeting…" />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="notes">Notes</Label>
          <RichTextEditor id="notes" name="notes" rows={6} defaultValue={note.notes} placeholder="What was discussed…" />
        </FieldGroup>
        {note.actionItems && (
          <FieldGroup>
            <Label compact>Original action items</Label>
            <RichTextView html={note.actionItems} className="text-sm text-navy-600" />
          </FieldGroup>
        )}
        <FieldGroup>
          <Label>Action items</Label>
          <ActionItemsQuickAdd
            name="actionItems"
            existingTasks={note.actionItemTasks}
            onToggleExisting={toggleActionItem}
          />
        </FieldGroup>
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
