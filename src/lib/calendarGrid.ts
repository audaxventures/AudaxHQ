import { todayInTimezone } from "@/lib/timezone";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const total = year * 12 + (month - 1) + delta;
  const y = Math.floor(total / 12);
  const m = ((total % 12) + 12) % 12;
  return { year: y, month: m + 1 };
}

export function monthParam(year: number, month: number): string {
  return `${year}-${pad(month)}`;
}

export function parseMonthParam(param: string | undefined, timezone: string): { year: number; month: number } {
  if (param && /^\d{4}-\d{2}$/.test(param)) {
    const [y, m] = param.split("-").map(Number);
    if (m >= 1 && m <= 12) return { year: y, month: m };
  }
  const [y, m] = todayInTimezone(timezone).split("-").map(Number);
  return { year: y, month: m };
}

export function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, 1))
  );
}

export function todayDateStr(timezone: string): string {
  return todayInTimezone(timezone);
}

export interface CalendarGridDay {
  date: string;
  day: number;
  inCurrentMonth: boolean;
}

/** Full weeks (Sunday-start) covering the given month, padded with adjacent-month days. */
export function buildMonthGrid(year: number, month: number): CalendarGridDay[] {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startWeekday = firstOfMonth.getUTCDay();
  const totalDays = daysInMonth(year, month);
  const { year: py, month: pm } = shiftMonth(year, month, -1);
  const prevTotalDays = daysInMonth(py, pm);

  const days: CalendarGridDay[] = [];

  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = prevTotalDays - i;
    days.push({ date: toDateStr(py, pm, d), day: d, inCurrentMonth: false });
  }

  for (let d = 1; d <= totalDays; d++) {
    days.push({ date: toDateStr(year, month, d), day: d, inCurrentMonth: true });
  }

  const { year: ny, month: nm } = shiftMonth(year, month, 1);
  let nextDay = 1;
  while (days.length % 7 !== 0) {
    days.push({ date: toDateStr(ny, nm, nextDay), day: nextDay, inCurrentMonth: false });
    nextDay++;
  }

  return days;
}
