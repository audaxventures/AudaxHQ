import { cn } from "@/lib/cn";
import { CalendarPill } from "@/components/calendar/CalendarPill";
import type { CalendarGridDay } from "@/lib/calendarGrid";
import type { CalendarEvent } from "@/lib/data/calendar";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayLabel(date: string) {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  const day = Number(date.slice(8, 10));
  return { weekday: WEEKDAY_LABELS[weekday], day };
}

/** Mobile-friendly stand-in for the month grid — a phone screen can't fit 7 legible columns, so this lists only the days that actually have something on them (plus today, for orientation), each full-width so pills show their whole title instead of truncating into unreadable chips. */
export function CalendarAgendaList({
  days,
  eventsByDate,
  today,
}: {
  days: CalendarGridDay[];
  eventsByDate: Map<string, CalendarEvent[]>;
  today: string;
}) {
  const relevantDays = days.filter(
    (d) => d.inCurrentMonth && ((eventsByDate.get(d.date)?.length ?? 0) > 0 || d.date === today)
  );

  if (relevantDays.length === 0) {
    return (
      <div className="rounded-2xl border border-navy-100 bg-cream-100/40 px-4 py-10 text-center text-sm text-navy-400">
        Nothing on the calendar this month.
      </div>
    );
  }

  return (
    <div className="divide-y divide-navy-100 overflow-hidden rounded-2xl border border-navy-100 bg-white">
      {relevantDays.map((d) => {
        const events = eventsByDate.get(d.date) ?? [];
        const isToday = d.date === today;
        const { weekday, day } = dayLabel(d.date);
        return (
          <div key={d.date} className="flex gap-3 p-3">
            <div className="flex w-11 shrink-0 flex-col items-center pt-0.5">
              <span className="text-[10px] font-medium uppercase tracking-wide text-navy-400">{weekday}</span>
              <span
                className={cn(
                  "mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                  isToday ? "bg-burnt-500 text-cream-50" : "text-navy-700"
                )}
              >
                {day}
              </span>
            </div>
            <div className="min-w-0 flex-1 space-y-1.5 pt-1">
              {events.length === 0 ? (
                <p className="text-sm text-navy-300">Nothing today.</p>
              ) : (
                events.map((event) => <CalendarPill key={`${event.kind}-${event.id}`} event={event} truncate={false} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
