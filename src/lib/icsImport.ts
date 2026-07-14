/**
 * One-way ICS ("iCalendar") feed import — reads a team member's existing
 * calendar (Google/Outlook/Apple's "secret address in iCal format") so
 * their busy time shows up on the shared Audax calendar. No OAuth: this is
 * a plain authenticated-by-obscurity URL fetch + RFC 5545 parse, the same
 * contract every "subscribe to calendar" feature uses.
 *
 * Recurrence support is intentionally scoped down to what real-world feeds
 * mostly use — FREQ=DAILY/WEEKLY/MONTHLY/YEARLY with INTERVAL/COUNT/UNTIL,
 * and BYDAY for WEEKLY only — rather than the full RRULE grammar. Events
 * are materialized into concrete occurrences within a bounded window at
 * sync time (see SYNC_WINDOW_*), not stored as a rule to expand at query
 * time, so calendar.ts can query them exactly like every other event type.
 */

import { zonedTimeToUtc } from "@/lib/timezone";

export const SYNC_WINDOW_PAST_DAYS = 35;
export const SYNC_WINDOW_FUTURE_DAYS = 180;
const MAX_OCCURRENCES_PER_EVENT = 500;
const MAX_FEED_BYTES = 5_000_000;
const FETCH_TIMEOUT_MS = 8000;

export interface ParsedIcsEvent {
  uid: string;
  title: string;
  start: Date;
  end: Date | null;
  allDay: boolean;
  location: string | null;
}

interface RawProperty {
  name: string;
  params: Record<string, string>;
  value: string;
}

function unfold(text: string): string[] {
  const rawLines = text.split(/\r\n|\n|\r/);
  const lines: string[] = [];
  for (const line of rawLines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  return lines;
}

function parseLine(line: string): RawProperty | null {
  const colonIdx = line.indexOf(":");
  if (colonIdx === -1) return null;
  const head = line.slice(0, colonIdx);
  const value = line.slice(colonIdx + 1);
  const [name, ...paramParts] = head.split(";");
  const params: Record<string, string> = {};
  for (const part of paramParts) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    params[part.slice(0, eq).toUpperCase()] = part.slice(eq + 1);
  }
  return { name: name.toUpperCase(), params, value };
}

function unescapeText(value: string): string {
  return value.replace(/\\n/gi, " ").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}

function parseDateTimeValue(
  value: string,
  params: Record<string, string>,
  fallbackTimeZone: string
): { date: Date; allDay: boolean } | null {
  const v = value.trim();
  if (params.VALUE === "DATE" || /^\d{8}$/.test(v)) {
    const y = Number(v.slice(0, 4));
    const mo = Number(v.slice(4, 6));
    const d = Number(v.slice(6, 8));
    if ([y, mo, d].some(Number.isNaN)) return null;
    return { date: new Date(Date.UTC(y, mo - 1, d)), allDay: true };
  }
  const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (!m) return null;
  const [, yy, mo, dd, hh, mi, ss, z] = m;
  const y = Number(yy);
  const moN = Number(mo);
  const d = Number(dd);
  const h = Number(hh);
  const min = Number(mi);
  const s = Number(ss);
  if (z) {
    return { date: new Date(Date.UTC(y, moN - 1, d, h, min, s)), allDay: false };
  }
  const zone = params.TZID || fallbackTimeZone;
  try {
    return { date: zonedTimeToUtc(y, moN, d, h, min, s, zone), allDay: false };
  } catch {
    return { date: zonedTimeToUtc(y, moN, d, h, min, s, fallbackTimeZone), allDay: false };
  }
}

function parseIsoDuration(value: string): number | null {
  const m = value.match(/^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!m) return null;
  const sign = m[1] === "-" ? -1 : 1;
  const weeks = Number(m[2] ?? 0);
  const days = Number(m[3] ?? 0);
  const hours = Number(m[4] ?? 0);
  const minutes = Number(m[5] ?? 0);
  const seconds = Number(m[6] ?? 0);
  return sign * ((weeks * 7 + days) * 86400 + hours * 3600 + minutes * 60 + seconds) * 1000;
}

const WEEKDAY_CODES: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

interface RRule {
  freq: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval: number;
  count: number | null;
  until: Date | null;
  byDay: number[] | null;
}

function parseRRule(value: string, fallbackTimeZone: string): RRule | null {
  const map: Record<string, string> = {};
  for (const part of value.split(";")) {
    const [k, v] = part.split("=");
    if (k && v) map[k.toUpperCase()] = v;
  }
  const freq = map.FREQ as RRule["freq"];
  if (!["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(freq)) return null;
  const until = map.UNTIL ? (parseDateTimeValue(map.UNTIL, {}, fallbackTimeZone)?.date ?? null) : null;
  const byDay = map.BYDAY
    ? map.BYDAY.split(",")
        .map((d) => WEEKDAY_CODES[d.slice(-2).toUpperCase()])
        .filter((n): n is number => n !== undefined)
    : null;
  return {
    freq,
    interval: map.INTERVAL ? Math.max(1, Number(map.INTERVAL)) : 1,
    count: map.COUNT ? Number(map.COUNT) : null,
    until,
    byDay,
  };
}

function addDaysUtc(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000);
}

function addMonthsUtc(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

/**
 * COUNT bounds the number of raw occurrences the rule generates, per RFC 5545 — EXDATE then
 * carves cancelled instances out of that fixed-size series rather than shrinking the count, and
 * the window filter is applied last since it only affects what we bother materializing.
 */
function expandRecurrence(start: Date, rrule: RRule, exdateMillis: Set<number>, windowStart: Date, windowEnd: Date): Date[] {
  const occurrences: Date[] = [];
  const countLimit = rrule.count ?? MAX_OCCURRENCES_PER_EVENT;
  const startWeekday = start.getUTCDay();
  let rawGenerated = 0;

  periods: for (let periodIndex = 0; periodIndex < 3000; periodIndex++) {
    let candidates: Date[];
    if (rrule.freq === "DAILY") {
      candidates = [addDaysUtc(start, periodIndex * rrule.interval)];
    } else if (rrule.freq === "WEEKLY") {
      const periodStart = addDaysUtc(start, periodIndex * rrule.interval * 7);
      candidates =
        rrule.byDay && rrule.byDay.length > 0
          ? rrule.byDay.map((wd) => addDaysUtc(periodStart, wd - startWeekday))
          : [periodStart];
    } else if (rrule.freq === "MONTHLY") {
      candidates = [addMonthsUtc(start, periodIndex * rrule.interval)];
    } else {
      const d = new Date(start.getTime());
      d.setUTCFullYear(d.getUTCFullYear() + periodIndex * rrule.interval);
      candidates = [d];
    }
    candidates.sort((a, b) => a.getTime() - b.getTime());

    if (candidates[0] && candidates[0].getTime() > windowEnd.getTime() + 366 * 86400000) break;

    for (const c of candidates) {
      if (rrule.until && c.getTime() > rrule.until.getTime()) break periods;
      rawGenerated++;
      if (rawGenerated > countLimit || rawGenerated > MAX_OCCURRENCES_PER_EVENT) break periods;
      if (exdateMillis.has(c.getTime())) continue;
      if (c.getTime() < windowStart.getTime() || c.getTime() > windowEnd.getTime()) continue;
      occurrences.push(c);
    }
  }

  return occurrences;
}

/** Splits raw ICS text into top-level VEVENT blocks (each an array of unfolded property lines). */
function splitVEvents(lines: string[]): string[][] {
  const events: string[][] = [];
  let current: string[] | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = [];
    } else if (line === "END:VEVENT") {
      if (current) events.push(current);
      current = null;
    } else if (current) {
      current.push(line);
    }
  }
  return events;
}

export function parseIcs(
  icsText: string,
  opts: { windowStart: Date; windowEnd: Date; fallbackTimeZone: string }
): ParsedIcsEvent[] {
  const lines = unfold(icsText);
  const results: ParsedIcsEvent[] = [];

  for (const block of splitVEvents(lines)) {
    const props = block.map(parseLine).filter((p): p is RawProperty => p !== null);
    const byName = (name: string) => props.filter((p) => p.name === name);
    const first = (name: string) => byName(name)[0] ?? null;

    if (first("STATUS")?.value.toUpperCase() === "CANCELLED") continue;

    const uidProp = first("UID");
    const dtstartProp = first("DTSTART");
    if (!uidProp || !dtstartProp) continue;

    const dtstart = parseDateTimeValue(dtstartProp.value, dtstartProp.params, opts.fallbackTimeZone);
    if (!dtstart) continue;

    let end: Date | null = null;
    const dtendProp = first("DTEND");
    const durationProp = first("DURATION");
    if (dtendProp) {
      end = parseDateTimeValue(dtendProp.value, dtendProp.params, opts.fallbackTimeZone)?.date ?? null;
    } else if (durationProp) {
      const ms = parseIsoDuration(durationProp.value);
      end = ms !== null ? new Date(dtstart.date.getTime() + ms) : null;
    }

    const title = unescapeText(first("SUMMARY")?.value ?? "Busy");
    const location = first("LOCATION") ? unescapeText(first("LOCATION")!.value) : null;
    const durationMs = end ? end.getTime() - dtstart.date.getTime() : null;

    const exdateMillis = new Set<number>();
    for (const prop of byName("EXDATE")) {
      for (const raw of prop.value.split(",")) {
        const parsed = parseDateTimeValue(raw, prop.params, opts.fallbackTimeZone);
        if (parsed) exdateMillis.add(parsed.date.getTime());
      }
    }

    const rruleProp = first("RRULE");
    const rrule = rruleProp ? parseRRule(rruleProp.value, opts.fallbackTimeZone) : null;

    const starts = rrule
      ? expandRecurrence(dtstart.date, rrule, exdateMillis, opts.windowStart, opts.windowEnd)
      : dtstart.date >= opts.windowStart && dtstart.date <= opts.windowEnd
        ? [dtstart.date]
        : [];

    for (const occStart of starts) {
      results.push({
        uid: uidProp.value,
        title,
        start: occStart,
        end: durationMs !== null ? new Date(occStart.getTime() + durationMs) : null,
        allDay: dtstart.allDay,
        location,
      });
    }
  }

  return results;
}

function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local")) return true;
  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = ipv4.slice(1).map(Number);
    if (a === 127 || a === 10 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) {
      return true;
    }
  }
  if (h === "::1") return true;
  return false;
}

export async function fetchAndParseIcsFeed(
  feedUrl: string,
  fallbackTimeZone: string
): Promise<{ events: ParsedIcsEvent[] } | { error: string }> {
  // Apple's "Public Calendar" share link uses webcal:// — a scheme meant to be handed off to
  // whatever calendar app is registered to open it, functionally identical to https:// for a
  // plain fetch. Normalizing it here means people can paste it exactly as Calendar.app gives it.
  const normalizedUrl = feedUrl.replace(/^webcals?:\/\//i, "https://");

  let url: URL;
  try {
    url = new URL(normalizedUrl);
  } catch {
    return { error: "That doesn't look like a valid URL." };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { error: "Only http:// and https:// calendar URLs are supported." };
  }
  if (isBlockedHost(url.hostname)) {
    return { error: "That address can't be reached." };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), { signal: controller.signal, headers: { Accept: "text/calendar, */*" } });
    if (!res.ok) return { error: `Feed returned ${res.status} ${res.statusText}.` };
    const text = await res.text();
    if (text.length > MAX_FEED_BYTES) return { error: "That feed is too large to import." };
    if (!text.includes("BEGIN:VCALENDAR")) return { error: "That doesn't look like a calendar (.ics) feed." };

    const now = new Date();
    const windowStart = addDaysUtc(now, -SYNC_WINDOW_PAST_DAYS);
    const windowEnd = addDaysUtc(now, SYNC_WINDOW_FUTURE_DAYS);
    return { events: parseIcs(text, { windowStart, windowEnd, fallbackTimeZone }) };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") return { error: "Timed out fetching that feed." };
    return { error: "Couldn't fetch that feed." };
  } finally {
    clearTimeout(timeout);
  }
}
