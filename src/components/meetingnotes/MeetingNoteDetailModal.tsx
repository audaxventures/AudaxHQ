"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Clock, Download, Mail, MapPin } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, FieldGroup, Select } from "@/components/ui/Field";
import { RichTextEditor, RichTextView } from "@/components/ui/RichTextEditor";
import { ActionItemsQuickAdd } from "@/components/meetingnotes/ActionItemsQuickAdd";
import { AddToCalendarLinks } from "@/components/meetingnotes/AddToCalendarLinks";
import { MeetingNoteEmailDrawer } from "@/components/meetingnotes/MeetingNoteEmailDrawer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { updateMeetingNote } from "@/lib/actions/meetingnotes";
import { setTaskStatus } from "@/lib/actions/tasks";
import { formatDate, formatDateInput, formatTimeInput } from "@/lib/format";
import type { MeetingNote } from "@/lib/types";

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

function durationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return `${hours} hr${hours > 1 ? "s" : ""}`;
}

export function MeetingNoteDetailModal({
  note,
  onClose,
  showOwner = true,
  senderFirstName,
}: {
  note: MeetingNote;
  onClose: () => void;
  /** Hide the owner name/link header when the modal is already opened from that client/lead's own page. */
  showOwner?: boolean;
  /** First name of whoever's signed in — used to sign the prefilled email body in the "Email to client/lead" drawer. */
  senderFirstName: string;
}) {
  const [pending, startTransition] = useTransition();
  const [, startToggleTransition] = useTransition();
  const [showEmailDrawer, setShowEmailDrawer] = useState(false);
  const ownerHref = note.clientId ? `/clients/${note.clientId}` : `/leads/${note.leadId}`;

  function toggleActionItem(taskId: string, completed: boolean) {
    startToggleTransition(async () => {
      await setTaskStatus(taskId, note.clientId, note.leadId, completed ? "COMPLETED" : "TO_BE_DONE");
    });
  }

  return (
    <Modal title="Meeting note" onClose={onClose}>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <a
          href={`/api/meeting-notes/${note.id}/pdf`}
          download
          className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 px-3 py-1.5 text-sm font-medium text-navy-700 transition-colors hover:border-navy-400 hover:bg-navy-100/50"
        >
          <Download size={14} /> Download PDF
        </a>
        <button
          type="button"
          onClick={() => setShowEmailDrawer(true)}
          disabled={!note.ownerEmail}
          title={note.ownerEmail ? undefined : "Add a contact email on the client/lead record first"}
          className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 px-3 py-1.5 text-sm font-medium text-navy-700 transition-colors hover:border-navy-400 hover:bg-navy-100/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-navy-200 disabled:hover:bg-transparent cursor-pointer"
        >
          <Mail size={14} /> Email to {note.clientId ? "client" : "lead"}
        </button>
        {note.lastEmailedTo && note.lastEmailedAt && (
          <span className="text-xs text-navy-400">
            Emailed to {note.lastEmailedTo} on {formatDate(note.lastEmailedAt)}
          </span>
        )}
      </div>

      {showEmailDrawer && (
        <MeetingNoteEmailDrawer note={note} senderFirstName={senderFirstName} onClose={() => setShowEmailDrawer(false)} />
      )}

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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FieldGroup>
            <Label htmlFor="startTime">Time (optional)</Label>
            <Input id="startTime" name="startTime" type="time" defaultValue={formatTimeInput(note.startTime)} className="min-w-0" />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="durationMinutes">Duration</Label>
            <Select id="durationMinutes" name="durationMinutes" defaultValue={String(note.durationMinutes ?? 30)} icon={Clock}>
              {DURATION_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {durationLabel(m)}
                </option>
              ))}
            </Select>
          </FieldGroup>
        </div>
        <FieldGroup>
          <Label htmlFor="location">Location (optional)</Label>
          <Input id="location" name="location" defaultValue={note.location ?? ""} placeholder="Zoom, address, phone call…" icon={MapPin} />
        </FieldGroup>
        {note.meetingDate && (
          <AddToCalendarLinks
            meeting={{
              title: note.title ?? "Meeting",
              location: note.location,
              date: formatDateInput(note.meetingDate),
              startTime: note.startTime,
              durationMinutes: note.durationMinutes,
            }}
          />
        )}
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
            theirLabel={note.clientId ? "Client" : "Lead"}
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
