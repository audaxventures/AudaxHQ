"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Input, Select, Label, FieldGroup } from "@/components/ui/Field";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { ActionItemsQuickAdd } from "@/components/meetingnotes/ActionItemsQuickAdd";
import { Button } from "@/components/ui/Button";
import { createMeetingNote } from "@/lib/actions/meetingnotes";

interface Option {
  id: string;
  companyName: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save meeting note"}
    </Button>
  );
}

export function NewMeetingNoteForm({ clients, leads }: { clients: Option[]; leads: Option[] }) {
  const [ownerType, setOwnerType] = useState<"CLIENT" | "LEAD">("CLIENT");

  return (
    <form action={createMeetingNote} className="space-y-5">
      <FieldGroup>
        <Label>This meeting was with</Label>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setOwnerType("CLIENT")}
            className={`rounded-full px-3 py-1.5 text-sm font-medium border transition-colors cursor-pointer ${
              ownerType === "CLIENT"
                ? "bg-navy-900 text-cream-50 border-navy-900"
                : "bg-transparent text-navy-600 border-navy-200 hover:border-navy-400"
            }`}
          >
            A client
          </button>
          <button
            type="button"
            onClick={() => setOwnerType("LEAD")}
            className={`rounded-full px-3 py-1.5 text-sm font-medium border transition-colors cursor-pointer ${
              ownerType === "LEAD"
                ? "bg-navy-900 text-cream-50 border-navy-900"
                : "bg-transparent text-navy-600 border-navy-200 hover:border-navy-400"
            }`}
          >
            A lead
          </button>
        </div>
        {ownerType === "CLIENT" ? (
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
        ) : (
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

      <FieldGroup>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" placeholder="e.g. Kickoff call, Q3 check-in…" />
      </FieldGroup>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <RichTextEditor id="agenda" name="agenda" rows={3} placeholder="What's planned for this meeting…" />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="notes">Notes</Label>
        <RichTextEditor id="notes" name="notes" rows={5} placeholder="What was discussed…" />
      </FieldGroup>
      <FieldGroup>
        <Label>Action items</Label>
        <p className="text-xs text-navy-400 mb-1.5">
          &ldquo;Us&rdquo; items become a to-do on your board; &ldquo;{ownerType === "CLIENT" ? "Client" : "Lead"}&rdquo; items stay here as their own commitment.
        </p>
        <ActionItemsQuickAdd name="actionItems" theirLabel={ownerType === "CLIENT" ? "Client" : "Lead"} />
      </FieldGroup>
      <SubmitButton />
    </form>
  );
}
