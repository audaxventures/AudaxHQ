"use client";

import { useRef, useState, useTransition } from "react";
import { Clock, MapPin, NotebookPen, Plus, Users } from "lucide-react";
import { Input, Label, FieldGroup, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { SectionPanel } from "@/components/ui/SectionPanel";
import { RichTextEditor, RichTextView } from "@/components/ui/RichTextEditor";
import { ActionItemsQuickAdd } from "@/components/meetingnotes/ActionItemsQuickAdd";
import { AddToCalendarLinks } from "@/components/meetingnotes/AddToCalendarLinks";
import { TimezoneField } from "@/components/meetingnotes/TimezoneField";
import { formatDate, formatDateInput, formatMonthYear, formatTime } from "@/lib/format";
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

type Owner = { type: "CLIENT"; clientId: string } | { type: "LEAD"; leadId: string } | { type: "PARTNER"; partnerId: string };

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

/** Every note except the one already shown in the "Next meeting" hero, grouped into month buckets — notes already arrive newest-first, so this only ever groups adjacent entries. */
function groupByMonth(notes: MeetingNote[], excludeId: string | undefined) {
  const groups: { monthKey: string; label: string; notes: MeetingNote[] }[] = [];
  for (const note of notes) {
    if (note.id === excludeId) continue;
    const monthKey = formatDateInput(note.meetingDate).slice(0, 7);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup?.monthKey === monthKey) lastGroup.notes.push(note);
    else groups.push({ monthKey, label: formatMonthYear(note.meetingDate), notes: [note] });
  }
  return groups;
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
  const [showAddNote, setShowAddNote] = useState(false);
  // Bumped after each successful add to force the RichTextEditors to remount
  // and clear — form.reset() doesn't touch contentEditable content.
  const [formKey, setFormKey] = useState(0);
  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;
  const next = nextUpcomingMeeting(notes, today);
  const monthGroups = groupByMonth(notes, next?.id);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <SectionPanel
        eyebrow="Meetings"
        title="Plan & log"
        description="Schedule what's ahead, write up what happened."
        tone="violet"
        matchHeight
      >
        <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1">
        <div className="rounded-xl border border-navy-100 bg-white/70 p-4">
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
              <FieldGroup>
                <Label htmlFor="schedule-title">Title (optional)</Label>
                <Input id="schedule-title" name="title" placeholder="e.g. Kickoff call, Q3 check-in…" />
              </FieldGroup>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowAddNote((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 hover:text-violet-800 cursor-pointer"
          >
            <NotebookPen size={15} /> {showAddNote ? "Cancel" : "Log a meeting note"}
          </button>
          {showAddNote && (
            <form
              ref={formRef}
              action={(formData) => {
                startTransition(async () => {
                  await createScopedMeetingNote(owner, formData);
                });
                formRef.current?.reset();
                setFormKey((k) => k + 1);
                setShowAddNote(false);
              }}
              className="space-y-3 mt-3 border-t border-navy-100 pt-3"
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
                  theirLabel={owner.type === "CLIENT" ? "Client" : owner.type === "LEAD" ? "Lead" : "Partner"}
                />
              </FieldGroup>
              <button
                type="submit"
                className="rounded-lg bg-navy-900 px-3.5 py-1.5 text-sm font-medium text-cream-50 hover:bg-navy-800 cursor-pointer transition-colors"
              >
                Save meeting note
              </button>
            </form>
          )}
        </div>
        </div>
      </SectionPanel>

      <SectionPanel
        eyebrow="History"
        title="Past meetings"
        description="Everything logged so far, most recent first."
        tone="slate"
        matchHeight
      >
        <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1 space-y-5">
          {monthGroups.length === 0 ? (
            <p className="text-sm text-navy-400">No past meeting notes yet.</p>
          ) : (
            monthGroups.map((group) => (
              <div key={group.monthKey}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">{group.label}</p>
                <ul>
                  {group.notes.map((note, i) => (
                    <li key={note.id} className="flex gap-3">
                      <div className="flex w-2.5 shrink-0 flex-col items-center">
                        <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-violet-400 ring-4 ring-white" />
                        {i < group.notes.length - 1 && <span className="w-px flex-1 bg-navy-100" />}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedId(note.id)}
                        className="min-w-0 flex-1 rounded-lg pb-4 pr-1 text-left hover:bg-cream-100/60 transition-colors cursor-pointer"
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
                        <RichTextView html={note.notes ?? note.agenda ?? ""} className="text-sm text-navy-800 line-clamp-2" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </SectionPanel>

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
