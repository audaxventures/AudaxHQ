"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Clock, Lock, MapPin } from "lucide-react";
import { Input, Select, Label, FieldGroup } from "@/components/ui/Field";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { ActionItemsQuickAdd } from "@/components/meetingnotes/ActionItemsQuickAdd";
import { TimezoneField } from "@/components/meetingnotes/TimezoneField";
import {
  ActionItemCategorySelect,
  DURATION_OPTIONS,
  durationLabel,
  MeetingDetailsFields,
  NoteOrganizeFields,
} from "@/components/meetingnotes/NoteFields";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { createMeetingNote } from "@/lib/actions/meetingnotes";
import type { NoteFolder } from "@/lib/types";

interface Option {
  id: string;
  companyName: string;
}

type OwnerType = "PRIVATE" | "CLIENT" | "LEAD";

const OWNER_TYPE_LABELS: Record<OwnerType, string> = {
  PRIVATE: "Private note",
  CLIENT: "Client meeting",
  LEAD: "Lead meeting",
};

function SubmitButton({ ownerType }: { ownerType: OwnerType }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : ownerType === "PRIVATE" ? "Save note" : "Save meeting note"}
    </Button>
  );
}

export function NewMeetingNoteForm({
  clients,
  leads,
  defaultTimezone,
  folders,
  knownTags,
  todoTypes,
  today,
  defaultFolderId,
}: {
  clients: Option[];
  leads: Option[];
  defaultTimezone: string;
  folders: NoteFolder[];
  knownTags: string[];
  todoTypes: { id: string; name: string }[];
  /** Today in the workspace's timezone — prefills the date on a private note. */
  today: string;
  defaultFolderId?: string | null;
}) {
  const [ownerType, setOwnerType] = useState<OwnerType>("PRIVATE");
  const isPrivate = ownerType === "PRIVATE";

  return (
    <form action={createMeetingNote} className="space-y-5">
      <input type="hidden" name="ownerType" value={ownerType} />
      <FieldGroup>
        <Label>What kind of note?</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {(Object.keys(OWNER_TYPE_LABELS) as OwnerType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setOwnerType(type)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors cursor-pointer",
                ownerType === type
                  ? "bg-navy-900 text-cream-50 border-navy-900"
                  : "bg-transparent text-navy-600 border-navy-200 hover:border-navy-400"
              )}
            >
              {type === "PRIVATE" && <Lock size={13} />}
              {OWNER_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
        {isPrivate && (
          <p className="text-xs text-navy-400">
            Only you can see private notes. Use them for boards, committees, ideas — anything that isn&rsquo;t tied to a client or lead.
          </p>
        )}
        {ownerType === "CLIENT" && (
          <Select name="clientId" required defaultValue="">
            <option value="" disabled>
              Select a client…
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </Select>
        )}
        {ownerType === "LEAD" && (
          <Select name="leadId" required defaultValue="">
            <option value="" disabled>
              Select a lead…
            </option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.companyName}
              </option>
            ))}
          </Select>
        )}
      </FieldGroup>

      {isPrivate ? (
        <>
          <FieldGroup>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="e.g. Foundation board — November meeting" />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="notes">Notes</Label>
            <RichTextEditor id="notes" name="notes" rows={12} placeholder="Start writing…" />
          </FieldGroup>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldGroup className="min-w-0">
              <Label htmlFor="meetingDate">Date</Label>
              <Input id="meetingDate" name="meetingDate" type="date" required defaultValue={today} className="min-w-0" />
            </FieldGroup>
          </div>
          <NoteOrganizeFields folders={folders} knownTags={knownTags} defaultFolderId={defaultFolderId} />
          <MeetingDetailsFields defaultTimezone={defaultTimezone} />
          {todoTypes.length > 0 && (
            <FieldGroup>
              <Label>Action items</Label>
              <p className="text-xs text-navy-400 mb-1.5">Each one becomes a to-do on your board.</p>
              <ActionItemsQuickAdd name="actionItems" teamOnly />
              <ActionItemCategorySelect todoTypes={todoTypes} />
            </FieldGroup>
          )}
        </>
      ) : (
        <>
          <FieldGroup>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="e.g. Kickoff call, Q3 check-in…" />
          </FieldGroup>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TimezoneField defaultValue={defaultTimezone} />
            <FieldGroup>
              <Label htmlFor="durationMinutes">Duration</Label>
              <Select id="durationMinutes" name="durationMinutes" defaultValue="30" icon={Clock}>
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
            <Input id="location" name="location" placeholder="Zoom, address, phone call…" icon={MapPin} />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="agenda">Agenda</Label>
            <RichTextEditor id="agenda" name="agenda" rows={3} placeholder="What's planned for this meeting…" />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="notes">Notes</Label>
            <RichTextEditor id="notes" name="notes" rows={5} placeholder="What was discussed…" />
          </FieldGroup>
          <NoteOrganizeFields folders={folders} knownTags={knownTags} defaultFolderId={defaultFolderId} />
          <FieldGroup>
            <Label>Action items</Label>
            <p className="text-xs text-navy-400 mb-1.5">
              &ldquo;Us&rdquo; items become a to-do on your board; &ldquo;{ownerType === "CLIENT" ? "Client" : "Lead"}&rdquo; items stay
              here as their own commitment.
            </p>
            <ActionItemsQuickAdd name="actionItems" theirLabel={ownerType === "CLIENT" ? "Client" : "Lead"} />
          </FieldGroup>
        </>
      )}
      <SubmitButton ownerType={ownerType} />
    </form>
  );
}
