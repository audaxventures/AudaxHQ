export function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "$0";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: num % 1 === 0 ? 0 : 2,
  }).format(num);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDateShort(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDateInput(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

/** Formats a Postgres `time` string ("14:30:00" or "14:30") as "2:30 PM". */
export function formatTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const [hoursStr, minutesStr] = value.split(":");
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

/** "HH:MM" (24-hour, for a <input type="time"> defaultValue) from a Postgres `time` string. */
export function formatTimeInput(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 5);
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? "";
}

/**
 * `today` is a YYYY-MM-DD string in the operator's configured timezone (see
 * src/lib/timezone.ts) — callers must supply it rather than letting this
 * default to UTC, since "today" is a local wall-clock concept.
 */
export function isOverdue(dateStr: string | null | undefined, today: string): boolean {
  if (!dateStr) return false;
  return formatDateInput(dateStr) < today;
}

export function isTodayOrPast(dateStr: string | null | undefined, today: string): boolean {
  if (!dateStr) return false;
  return formatDateInput(dateStr) <= today;
}

/** True when value falls within [from, to] (either bound optional/open-ended). False if value is null/unparseable. */
export function isDateInRange(
  value: string | Date | null | undefined,
  from?: string,
  to?: string
): boolean {
  if (!from && !to) return true;
  const normalized = formatDateInput(value);
  if (!normalized) return false;
  if (from && normalized < from) return false;
  if (to && normalized > to) return false;
  return true;
}
