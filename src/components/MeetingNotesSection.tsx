"use client";

import { useRef, useState, useTransition } from "react";
import { Clock, MapPin, Plus, Users } from "lucide-react";
import { Input, Label, FieldGroup, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { RichTextEditor, RichTextView } from "@/components/ui/RichTextEditor";
import { ActionItemsQuickAdd } from "@/components/meetingnotes/ActionItemsQuickAdd";
import { AddToCalendarLinks } from "@/components/meetingnotes/AddToCalendarLinks";
import { TimezoneField } from "@/components/meetingnotes/TimezoneField";
import { formatDate, formatDateInput, formatTime } from "@/lib/format";
import { timezoneAbbreviation } from "@/lib/timezone";
import type { MeetingNote } from "@/lib/types";
import { createScopedMeetingNote, scheduleMeeting } from "@/lib/actions/meetingnotes";
import { MeetingNoteDetailModal } from "@/components/meetingnotes/MeetingNoteDetailModal";

/** "2:00 PM" + " EST" when a timezone is set, else just the time — shared by the next-meeting summary and the notes list. */
function timeWithZone(startTime: string | null, timezone: string | null, meetingDate: string): string | null {
  const time = formatTime(startTime);
  if (!time) return null;
  return timezone ? `${time} ${timezoneAbbreviation(timezone, meetingDate)}` : time;
}

type Owner = { type: "CLIENT"; clientId: string } | { type: "LEAD"; leadId: string };

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

function durationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return `${hours} hr${hours > 1 ? "s" : ""}`;
}

/** Nearest not-yet-past meeting, by date then time — date-only comparison, matching the rest of the app's "today" conventions. */
function nextUpcomingMeeting(notes: MeetingNote[], today: string): MeetingNote | null {
  // meetingDate arrives as a Date value (the SQL layer's `date` columns
  // deserialize that way despite the string type), so it's normalized to
  // "YYYY-MM-DD" the same way every other date-comparing helper in this app
  // does, via formatDateInput, before it's compared as a string.
  const upcoming = notes.filter((n) => formatDateInput(n.meetingDate) >= today);
  if (upcoming.length === 0) return null;
  return upcoming
    .slice()
    .sort((a, b) => {
      const aDate = formatDateInput(a.meetingDate);
      const bDate = formatDateInput(b.meetingDate);
      if (aDate !== bDate) return aDate.localeCompare(bDate);
      return (a.startTime ?? "99:99:99").localeCompare(b.startTime ?? "99:99:99");
    })[0];
}

export function MeetingNotesSection({
  owner,
  notes,
  today,
  senderFirstName,
  defaultTimezone,
}: {
  owner: Owner;
  notes: MeetingNote[];
  today: string;
  senderFirstName: string;
  defaultTimezone: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const scheduleFormRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();
  const [, startScheduleTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  // Bumped after each successful add to force the RichTextEditors to remount
  // and clear — form.reset() doesn't touch contentEditable content.
  const [formKey, setFormKey] = useState(0);
  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;
  const next = nextUpcomingMeeting(notes, today);

  return (
    <div>
      <div className="mb-5 rounded-xl border border-navy-100 bg-cream-100/50 p-4">
        {next ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-navy-400">Next meeting</p>
            <p className="mt-1 font-heading text-base font-medium text-navy-900">
              {formatDate(next.meetingDate)}
              {next.startTime && (
                <span className="font-sans text-sm text-navy-500">
                  {" "}
                  at {timeWithZone(next.startTime, next.timezone, next.meetingDate)}
                </span>
              )}
            </p>
            {next.location && (
              <p className="mt-0.5 flex items-center gap-1 text-sm text-navy-500">
                <MapPin size={13} /> {next.location}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedId(next.id)}
                className="text-xs font-medium text-burnt-600 hover:underline cursor-pointer"
              >
                View details
              </button>
              <AddToCalendarLinks
                meeting={{
                  title: next.title ?? "Meeting",
                  location: next.location,
                  date: formatDateInput(next.meetingDate),
                  startTime: next.startTime,
                  durationMinutes: next.durationMinutes,
                }}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-navy-500">No meeting scheduled yet.</p>
        )}
        <button
          type="button"
          onClick={() => setShowSchedule((v) => !v)}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-navy-700 hover:text-navy-900 cursor-pointer"
        >
          <Plus size={13} /> {showSchedule ? "Cancel" : "Schedule a meeting"}
        </button>
        {showSchedule && (
          <form
            ref={scheduleFormRef}
            action={(formData) => {
              startScheduleTransition(async () => {
                await scheduleMeeting(owner, formData);
              });
              scheduleFormRef.current?.reset();
              setShowSchedule(false);
            }}
            className="mt-3 space-y-3 border-t border-navy-100 pt-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup className="min-w-0">
                <Label htmlFor="schedule-date">Date</Label>
                <Input id="schedule-date" name="meetingDate" type="date" required className="min-w-0" />
              </FieldGroup>
              <FieldGroup className="min-w-0">
                <Label htmlFor="schedule-time">Time (optional)</Label>
                <Input id="schedule-time" name="startTime" type="time" className="min-w-0" />
              </FieldGroup>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <TimezoneField id="schedule-timezone" defaultValue={defaultTimezone} />
              <FieldGroup>
                <Label htmlFor="schedule-duration">Duration</Label>
                <Select id="schedule-duration" name="durationMinutes" defaultValue="30" icon={Clock}>
                  {DURATION_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {durationLabel(m)}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
              <FieldGroup>
                <Label htmlFor="schedule-location">Location (optional)</Label>
                <Input id="schedule-location" name="location" placeholder="Zoom, address, phone call…" icon={MapPin} />
              </FieldGroup>
            </div>
            <Button type="submit" size="sm">
              Schedule meeting
            </Button>
          </form>
        )}
      </div>

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
                  <p className="text-xs font-medium text-navy-500">
                    {formatDate(note.meetingDate)}
                    {note.startTime && ` at ${timeWithZone(note.startTime, note.timezone, note.meetingDate)}`}
                  </p>
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
          senderFirstName={senderFirstName}
          defaultTimezone={defaultTimezone}
        />
      )}
    </div>
  );
}
