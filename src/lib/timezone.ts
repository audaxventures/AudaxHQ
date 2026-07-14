/** The app-wide fallback used until the operator sets a real one in Settings → Profile. */
export const DEFAULT_TIMEZONE = "UTC";

/** "Today" as a YYYY-MM-DD string in the given IANA timezone — the local wall-clock calendar day. */
export function todayInTimezone(timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** The current hour (0-23) of the wall clock in the given IANA timezone — for time-of-day greetings. */
export function currentHourInTimezone(timezone: string): number {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "numeric", hourCycle: "h23" }).format(new Date())
  );
}

/** Every IANA timezone identifier the runtime knows about, for a Settings picker. */
export function listTimezones(): string[] {
  if (typeof Intl.supportedValuesOf === "function") {
    return Intl.supportedValuesOf("timeZone");
  }
  return [DEFAULT_TIMEZONE];
}

/** How far `timeZone`'s wall clock is ahead of UTC, in ms, at the given instant (negative west of UTC). */
function tzOffsetMillis(timeZone: string, atUtcMillis: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(atUtcMillis));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - atUtcMillis;
}

/**
 * Converts a wall-clock date/time in `timeZone` to the UTC instant it represents — e.g. for
 * parsing an ICS `DTSTART;TZID=America/Edmonton:20260719T143000` value. Iterates once to handle
 * the DST-transition edge case where the offset at the guessed instant differs from the offset
 * that actually applies to the wall-clock time.
 */
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string
): Date {
  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const offset = tzOffsetMillis(timeZone, naiveUtc);
  const offset2 = tzOffsetMillis(timeZone, naiveUtc - offset);
  return new Date(naiveUtc - offset2);
}
