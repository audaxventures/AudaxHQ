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

/** Every IANA timezone identifier the runtime knows about, for a Settings picker. */
export function listTimezones(): string[] {
  if (typeof Intl.supportedValuesOf === "function") {
    return Intl.supportedValuesOf("timeZone");
  }
  return [DEFAULT_TIMEZONE];
}
