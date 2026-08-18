"use client";

import { useRef, useTransition } from "react";
import { MapPin } from "lucide-react";
import { Input, Label, FieldGroup } from "@/components/ui/Field";
import { Drawer } from "@/components/ui/Drawer";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { ActionItemsQuickAdd } from "@/components/meetingnotes/ActionItemsQuickAdd";
import { TimezoneField } from "@/components/meetingnotes/TimezoneField";
import { createScopedMeetingNote } from "@/lib/actions/meetingnotes";

type Owner = { type: "CLIENT"; clientId: string } | { type: "LEAD"; leadId: string } | { type: "PARTNER"; partnerId: string };

/** The full "log a meeting note" form, in a Drawer instead of an inline panel — the form (agenda, notes, action items) is long enough that scrolling within a fixed-height SectionPanel felt cramped; a drawer gives it the whole viewport height to scroll in instead. */
export function AddMeetingNoteDrawer({
  owner,
  defaultTimezone,
  onClose,
}: {
  owner: Owner;
  defaultTimezone: string;
  onClose: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Drawer title="Log a meeting note" description="What's planned, what was discussed, and what's next." onClose={onClose}>
      <form
        ref={formRef}
        action={(formData) => {
          startTransition(async () => {
            await createScopedMeetingNote(owner, formData);
            onClose();
          });
        }}
        className="space-y-4"
      >
        <FieldGroup>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" placeholder="e.g. Kickoff call, Q3 check-in…" />
        </FieldGroup>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FieldGroup className="min-w-0">
            <Label htmlFor="meetingDate">Meeting date</Label>
            <Input id="meetingDate" name="meetingDate" type="date" required className="min-w-0" />
          </FieldGroup>
          <FieldGroup className="min-w-0">
            <Label htmlFor="startTime">Time (optional)</Label>
            <Input id="startTime" name="startTime" type="time" className="min-w-0" />
          </FieldGroup>
        </div>
        <FieldGroup>
          <Label htmlFor="attendees">Attendees</Label>
          <Input id="attendees" name="attendees" placeholder="Jane, Bob…" />
        </FieldGroup>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TimezoneField defaultValue={defaultTimezone} />
          <FieldGroup>
            <Label htmlFor="location">Location (optional)</Label>
            <Input id="location" name="location" placeholder="Zoom, address, phone call…" icon={MapPin} />
          </FieldGroup>
        </div>
        <FieldGroup>
          <Label htmlFor="agenda">Agenda</Label>
          <RichTextEditor id="agenda" name="agenda" rows={2} placeholder="What's planned for this meeting…" />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="notes">Notes</Label>
          <RichTextEditor id="notes" name="notes" rows={3} placeholder="What was discussed…" />
        </FieldGroup>
        <FieldGroup>
          <Label>Action items</Label>
          <ActionItemsQuickAdd
            name="actionItems"
            theirLabel={owner.type === "CLIENT" ? "Client" : owner.type === "LEAD" ? "Lead" : "Partner"}
          />
        </FieldGroup>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-navy-900 px-3.5 py-2.5 text-sm font-medium text-cream-50 hover:bg-navy-800 cursor-pointer transition-colors disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save meeting note"}
        </button>
      </form>
    </Drawer>
  );
}
