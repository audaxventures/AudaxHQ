"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Building2, CalendarDays, Check, ChevronRight, Clock, ListChecks, Lock, MapPin, Tag, Target, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input, Select, Label, FieldGroup } from "@/components/ui/Field";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Button } from "@/components/ui/Button";
import { ActionItemsQuickAdd } from "@/components/meetingnotes/ActionItemsQuickAdd";
import { TimezoneField } from "@/components/meetingnotes/TimezoneField";
import { ActionItemCategorySelect, DURATION_OPTIONS, durationLabel, NoteOrganizeFields } from "@/components/meetingnotes/NoteFields";
import { HUES, type HueClasses } from "@/components/meetingnotes/noteColors";
import { cn } from "@/lib/cn";
import { createMeetingNote } from "@/lib/actions/meetingnotes";
import type { NoteFolder } from "@/lib/types";

interface Option {
  id: string;
  companyName: string;
}

type OwnerType = "PRIVATE" | "CLIENT" | "LEAD";

const TYPES: { key: OwnerType; label: string; description: string; icon: typeof Lock; hue: HueClasses }[] = [
  { key: "PRIVATE", label: "Private note", description: "Only you can see it — boards, ideas, anything", icon: Lock, hue: HUES.teal },
  { key: "CLIENT", label: "Client meeting", description: "Logged on a client's record", icon: Building2, hue: HUES.sage },
  { key: "LEAD", label: "Lead meeting", description: "Logged on a lead's record", icon: Target, hue: HUES.violet },
];

function SubmitButton({ ownerType }: { ownerType: OwnerType }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full justify-center">
      <Check size={16} /> {pending ? "Saving…" : ownerType === "PRIVATE" ? "Save note" : "Save meeting note"}
    </Button>
  );
}

function SideCard({ title, icon: Icon, children }: { title: string; icon: typeof Lock; children: React.ReactNode }) {
  return (
    <Card className="bg-white p-5">
      <p className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-navy-400">
        <Icon size={14} /> {title}
      </p>
      <div className="space-y-4">{children}</div>
    </Card>
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
  cancelHref,
}: {
  clients: Option[];
  leads: Option[];
  defaultTimezone: string;
  folders: NoteFolder[];
  knownTags: string[];
  todoTypes: { id: string; name: string }[];
  /** Today in the workspace's timezone — prefills the date. */
  today: string;
  defaultFolderId?: string | null;
  /** Where Cancel goes — the Notes page (or folder) this was opened from. */
  cancelHref: string;
}) {
  const [ownerType, setOwnerType] = useState<OwnerType>("PRIVATE");
  const isPrivate = ownerType === "PRIVATE";
  const theirLabel = ownerType === "CLIENT" ? "Client" : "Lead";
  const showActionItems = !isPrivate || todoTypes.length > 0;

  const timeFields = (
    <>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup className="min-w-0">
          <Label htmlFor="startTime">Time</Label>
          <Input id="startTime" name="startTime" type="time" className="min-w-0" />
        </FieldGroup>
        <FieldGroup className="min-w-0">
          <Label htmlFor="durationMinutes">Duration</Label>
          <Select id="durationMinutes" name="durationMinutes" defaultValue={isPrivate ? "" : "30"} icon={Clock}>
            <option value="">Not set</option>
            {DURATION_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {durationLabel(m)}
              </option>
            ))}
          </Select>
        </FieldGroup>
      </div>
      <FieldGroup>
        <Label htmlFor="attendees">Attendees</Label>
        <Input id="attendees" name="attendees" placeholder="Jane, Bob…" icon={Users} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="location">Location</Label>
        <Input id="location" name="location" placeholder="Zoom, boardroom, phone…" icon={MapPin} />
      </FieldGroup>
      <TimezoneField defaultValue={defaultTimezone} />
    </>
  );

  return (
    <form action={createMeetingNote} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <input type="hidden" name="ownerType" value={ownerType} />

      {/* Main column: what kind, then the writing itself. */}
      <div className="min-w-0 space-y-6">
        <div role="radiogroup" aria-label="What kind of note?" className="grid grid-cols-3 gap-2 sm:gap-3">
          {TYPES.map((t) => {
            const active = ownerType === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setOwnerType(t.key)}
                className={cn(
                  "relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl border bg-white p-3 text-center transition-all sm:flex-row sm:items-start sm:gap-3 sm:p-4 sm:text-left",
                  active ? "border-navy-900 shadow-[0_0_0_1px_var(--color-navy-900)]" : "border-navy-100 hover:border-navy-300"
                )}
              >
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", t.hue.soft, t.hue.text)}>
                  <t.icon size={17} />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-medium text-navy-900 sm:text-sm">{t.label}</span>
                  <span className="mt-0.5 hidden text-xs leading-snug text-navy-400 sm:block">{t.description}</span>
                </span>
                {active && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-navy-900 text-cream-50">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <Card className="bg-white p-5 sm:p-6">
          <div className="space-y-5">
            {ownerType === "CLIENT" && (
              <FieldGroup>
                <Label htmlFor="clientId">Client</Label>
                <Select id="clientId" name="clientId" required defaultValue="" icon={Building2}>
                  <option value="" disabled>
                    Select a client…
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
            )}
            {ownerType === "LEAD" && (
              <FieldGroup>
                <Label htmlFor="leadId">Lead</Label>
                <Select id="leadId" name="leadId" required defaultValue="" icon={Target}>
                  <option value="" disabled>
                    Select a lead…
                  </option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.companyName}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
            )}

            <div>
              <label htmlFor="title" className="sr-only">
                Title
              </label>
              <input
                id="title"
                name="title"
                autoFocus
                placeholder={isPrivate ? "Untitled note" : "Meeting title, e.g. Q3 check-in"}
                className="w-full border-0 border-b border-navy-100 bg-transparent pb-3 font-heading text-2xl font-medium text-navy-900 placeholder:text-navy-300 focus:border-burnt-400 focus:outline-none"
              />
            </div>

            {!isPrivate && (
              <FieldGroup>
                <Label htmlFor="agenda">Agenda</Label>
                <RichTextEditor id="agenda" name="agenda" rows={3} placeholder="What's planned for this meeting…" />
              </FieldGroup>
            )}
            <FieldGroup>
              <Label htmlFor="notes">Notes</Label>
              <RichTextEditor
                id="notes"
                name="notes"
                rows={isPrivate ? 16 : 10}
                placeholder={isPrivate ? "Start writing…" : "What was discussed…"}
              />
            </FieldGroup>
          </div>
        </Card>

        {showActionItems && (
          <Card className="bg-white p-5 sm:p-6">
            <p className="mb-1 flex items-center gap-2 text-sm font-medium text-navy-900">
              <ListChecks size={16} className="text-burnt-500" /> Action items
            </p>
            <p className="mb-3 text-xs text-navy-400">
              {isPrivate ? (
                "Each one becomes a to-do on your board."
              ) : (
                <>
                  &ldquo;Us&rdquo; items become a to-do on your board; &ldquo;{theirLabel}&rdquo; items stay on this note as their own
                  commitment.
                </>
              )}
            </p>
            {isPrivate ? (
              <>
                <ActionItemsQuickAdd name="actionItems" teamOnly />
                <ActionItemCategorySelect todoTypes={todoTypes} />
              </>
            ) : (
              <ActionItemsQuickAdd key={ownerType} name="actionItems" theirLabel={theirLabel} />
            )}
          </Card>
        )}
      </div>

      {/* Side column: when, where it's filed, save. */}
      <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <SideCard title="Details" icon={CalendarDays}>
          <FieldGroup>
            <Label htmlFor="meetingDate">Date</Label>
            <Input id="meetingDate" name="meetingDate" type="date" required defaultValue={today} className="max-w-none" />
          </FieldGroup>
          {isPrivate ? (
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm text-navy-500 select-none hover:text-navy-800">
                <ChevronRight size={14} className="transition-transform group-open:rotate-90" />
                Add meeting details <span className="text-navy-300">(optional)</span>
              </summary>
              <div className="mt-4 space-y-4">{timeFields}</div>
            </details>
          ) : (
            timeFields
          )}
        </SideCard>

        <SideCard title="Organize" icon={Tag}>
          <NoteOrganizeFields folders={folders} knownTags={knownTags} defaultFolderId={defaultFolderId} stacked />
        </SideCard>

        <div className="space-y-2">
          <SubmitButton ownerType={ownerType} />
          <Link
            href={cancelHref}
            className="block rounded-lg py-2 text-center text-sm text-navy-500 transition-colors hover:bg-cream-100 hover:text-navy-800"
          >
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}
