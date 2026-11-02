"use client";

import { ChevronRight, Clock, Folder, MapPin, Tag } from "lucide-react";
import { Input, Label, FieldGroup, Select } from "@/components/ui/Field";
import { TimezoneField } from "@/components/meetingnotes/TimezoneField";
import { formatTimeInput } from "@/lib/format";
import type { NoteFolder } from "@/lib/types";

export const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

export function durationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return `${hours} hr${hours > 1 ? "s" : ""}`;
}

/** Top-level folders, each followed by its subfolders — the order both the picker and the sidebar use. */
export function orderFolders(folders: NoteFolder[]): { folder: NoteFolder; depth: 0 | 1 }[] {
  const out: { folder: NoteFolder; depth: 0 | 1 }[] = [];
  for (const top of folders.filter((f) => !f.parentId)) {
    out.push({ folder: top, depth: 0 });
    for (const child of folders.filter((f) => f.parentId === top.id)) out.push({ folder: child, depth: 1 });
  }
  return out;
}

/**
 * Folder + tags pickers. Both are personal to whoever is signed in. A
 * folder with subfolders shows as a heading only — notes go in its
 * subfolders. A note already sitting directly in one (from before its
 * first subfolder was added) keeps that option so saving doesn't move it.
 */
export function NoteOrganizeFields({
  folders,
  knownTags,
  defaultFolderId,
  defaultTags,
  stacked = false,
}: {
  folders: NoteFolder[];
  knownTags: string[];
  defaultFolderId?: string | null;
  defaultTags?: string[];
  /** One field per row — for narrow side panels. */
  stacked?: boolean;
}) {
  return (
    <div className={stacked ? "space-y-4" : "grid grid-cols-1 gap-4 sm:grid-cols-2"}>
      <FieldGroup className="min-w-0">
        <Label htmlFor="note-folder">Folder</Label>
        <Select id="note-folder" name="folderId" defaultValue={defaultFolderId ?? ""} icon={Folder}>
          <option value="">No folder</option>
          {folders
            .filter((f) => !f.parentId)
            .map((top) => {
              const children = folders.filter((f) => f.parentId === top.id);
              if (children.length === 0) {
                return (
                  <option key={top.id} value={top.id}>
                    {top.name}
                  </option>
                );
              }
              // A folder with subfolders is for sorting only — notes go in its subfolders.
              return (
                <optgroup key={top.id} label={top.name}>
                  {defaultFolderId === top.id && (
                    <option value={top.id}>{top.name} (pick a subfolder)</option>
                  )}
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
        </Select>
      </FieldGroup>
      <FieldGroup className="min-w-0">
        <Label htmlFor="note-tags">Tags</Label>
        <Input
          id="note-tags"
          name="tags"
          defaultValue={defaultTags?.join(", ") ?? ""}
          placeholder="governance, budget…"
          icon={Tag}
          list="note-tag-suggestions"
          autoComplete="off"
        />
        <datalist id="note-tag-suggestions">
          {knownTags.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        <p className="text-xs text-navy-400">Separate tags with commas.</p>
      </FieldGroup>
    </div>
  );
}

/**
 * Time / attendees / timezone / duration / location, folded away by
 * default — on a private note the notes come first and these are optional.
 * Uses <details>, so the inputs still submit while folded (an edit never
 * wipes values just because the section was closed).
 */
export function MeetingDetailsFields({
  defaultTimezone,
  defaults,
}: {
  defaultTimezone: string;
  defaults?: {
    startTime: string | null;
    timezone: string | null;
    durationMinutes: number | null;
    location: string | null;
    attendees: string | null;
  };
}) {
  const hasAny = !!(defaults?.startTime || defaults?.durationMinutes || defaults?.location || defaults?.attendees);
  return (
    <details open={hasAny} className="group rounded-lg border border-navy-100 px-4 py-3">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-navy-600 select-none">
        <ChevronRight size={14} className="transition-transform group-open:rotate-90" />
        Meeting details <span className="font-normal text-navy-400">(optional)</span>
      </summary>
      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldGroup className="min-w-0">
            <Label htmlFor="startTime">Time</Label>
            <Input
              id="startTime"
              name="startTime"
              type="time"
              defaultValue={formatTimeInput(defaults?.startTime ?? null)}
              className="min-w-0"
            />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="durationMinutes">Duration</Label>
            <Select
              id="durationMinutes"
              name="durationMinutes"
              defaultValue={defaults?.durationMinutes ? String(defaults.durationMinutes) : ""}
              icon={Clock}
            >
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
          <Input id="attendees" name="attendees" defaultValue={defaults?.attendees ?? ""} placeholder="Jane, Bob…" />
        </FieldGroup>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TimezoneField defaultValue={defaults?.timezone ?? defaultTimezone} />
          <FieldGroup>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              defaultValue={defaults?.location ?? ""}
              placeholder="Boardroom, Zoom…"
              icon={MapPin}
            />
          </FieldGroup>
        </div>
      </div>
    </details>
  );
}

/** Private notes have no client/lead, so their action items land on the to-do board under one of the workspace's custom categories. */
export function ActionItemCategorySelect({ todoTypes }: { todoTypes: { id: string; name: string }[] }) {
  const defaultId = (todoTypes.find((t) => t.name.toLowerCase() === "general") ?? todoTypes[0])?.id ?? "";
  return (
    <div className="mt-2 flex items-center gap-2">
      <Label htmlFor="actionItemTodoTypeId" compact className="mb-0 shrink-0 text-xs">
        Add to-dos under
      </Label>
      <Select id="actionItemTodoTypeId" name="actionItemTodoTypeId" defaultValue={defaultId} className="max-w-[14rem] py-1.5 text-sm">
        {todoTypes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
