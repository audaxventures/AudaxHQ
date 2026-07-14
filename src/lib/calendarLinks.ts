/**
 * Generates outbound "add this one meeting to my calendar" links — no
 * integration, no OAuth, just a Google Calendar prefill URL and a
 * downloadable .ics file, built from data we already have. Interprets
 * date/startTime as wall-clock time in whoever's browser renders this
 * (this runs client-side), which is the right assumption for a small
 * business scheduling with a client in roughly the same timezone.
 */

export interface CalendarLinkInput {
  title: string;
  description?: string | null;
  location?: string | null;
  /** YYYY-MM-DD */
  date: string;
  /** "HH:MM" or "HH:MM:SS" (24-hour) — omit for an all-day event. */
  startTime?: string | null;
  durationMinutes?: number | null;
}

const DEFAULT_DURATION_MINUTES = 60;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function localStart(date: string, startTime?: string | null): Date | null {
  if (!startTime) return null;
  const [h, m] = startTime.split(":").map(Number);
  const [y, mo, d] = date.split("-").map(Number);
  if ([h, m, y, mo, d].some((n) => Number.isNaN(n))) return null;
  return new Date(y, mo - 1, d, h, m);
}

function toUtcStamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function toDateStamp(date: string): string {
  return date.replaceAll("-", "");
}

function nextDateStamp(date: string): string {
  const [y, mo, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, mo - 1, d + 1));
  return toDateStamp(next.toISOString().slice(0, 10));
}

function escapeIcsText(text: string): string {
  return text.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
}

export function buildGoogleCalendarUrl(input: CalendarLinkInput): string {
  const params = new URLSearchParams({ action: "TEMPLATE", text: input.title });
  if (input.description) params.set("details", input.description);
  if (input.location) params.set("location", input.location);

  const start = localStart(input.date, input.startTime);
  if (start) {
    const end = new Date(start.getTime() + (input.durationMinutes ?? DEFAULT_DURATION_MINUTES) * 60000);
    params.set("dates", `${toUtcStamp(start)}/${toUtcStamp(end)}`);
  } else {
    params.set("dates", `${toDateStamp(input.date)}/${nextDateStamp(input.date)}`);
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsContent(input: CalendarLinkInput): string {
  const start = localStart(input.date, input.startTime);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Audax HQ//Meeting//EN",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@audaxhq.ca`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
  ];
  if (start) {
    const end = new Date(start.getTime() + (input.durationMinutes ?? DEFAULT_DURATION_MINUTES) * 60000);
    lines.push(`DTSTART:${toUtcStamp(start)}`, `DTEND:${toUtcStamp(end)}`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${toDateStamp(input.date)}`, `DTEND;VALUE=DATE:${nextDateStamp(input.date)}`);
  }
  lines.push(`SUMMARY:${escapeIcsText(input.title)}`);
  if (input.location) lines.push(`LOCATION:${escapeIcsText(input.location)}`);
  if (input.description) lines.push(`DESCRIPTION:${escapeIcsText(input.description)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}
