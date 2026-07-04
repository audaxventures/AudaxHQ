import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { CalendarControls } from "@/components/calendar/CalendarControls";
import { CalendarPill } from "@/components/calendar/CalendarPill";
import { buildMonthGrid, parseMonthParam, todayDateStr } from "@/lib/calendarGrid";
import { listCalendarEvents, CALENDAR_EVENT_KIND_ORDER, type CalendarEventKind } from "@/lib/data/calendar";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_PILLS_PER_DAY = 3;

function parseTypesParam(param: string | undefined): Set<CalendarEventKind> {
  if (!param) return new Set(CALENDAR_EVENT_KIND_ORDER);
  const requested = param.split(",").filter((t): t is CalendarEventKind =>
    (CALENDAR_EVENT_KIND_ORDER as string[]).includes(t)
  );
  return requested.length > 0 ? new Set(requested) : new Set(CALENDAR_EVENT_KIND_ORDER);
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; types?: string }>;
}) {
  const { month: monthParamValue, types: typesParamValue } = await searchParams;
  const { year, month } = parseMonthParam(monthParamValue);
  const activeTypes = parseTypesParam(typesParamValue);
  const grid = buildMonthGrid(year, month);
  const today = todayDateStr();

  const allEvents = await listCalendarEvents(grid[0].date, grid[grid.length - 1].date);
  const events = allEvents.filter((e) => activeTypes.has(e.kind));

  const eventsByDate = new Map<string, typeof events>();
  for (const event of events) {
    const list = eventsByDate.get(event.date) ?? [];
    list.push(event);
    eventsByDate.set(event.date, list);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Calendar"
        title="Calendar"
        description="Follow-ups, meeting notes, and task due dates, all in one place."
      />

      <CalendarControls year={year} month={month} activeTypes={activeTypes} />

      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 border-b border-navy-100">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-2 py-2 text-center text-xs font-medium uppercase tracking-wide text-navy-400"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((day) => {
            const dayEvents = eventsByDate.get(day.date) ?? [];
            const visible = dayEvents.slice(0, MAX_PILLS_PER_DAY);
            const overflow = dayEvents.length - visible.length;
            const isToday = day.date === today;
            return (
              <div
                key={day.date}
                className={cn(
                  "min-h-[92px] sm:min-h-[108px] border-b border-r border-navy-100 p-1.5 [&:nth-child(7n)]:border-r-0",
                  !day.inCurrentMonth && "bg-cream-100/40"
                )}
              >
                <p
                  className={cn(
                    "mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium",
                    isToday
                      ? "bg-burnt-500 text-cream-50"
                      : day.inCurrentMonth
                        ? "text-navy-700"
                        : "text-navy-300"
                  )}
                >
                  {day.day}
                </p>
                <div className="space-y-1">
                  {visible.map((event) => (
                    <CalendarPill key={`${event.kind}-${event.id}`} event={event} />
                  ))}
                  {overflow > 0 && (
                    <p className="px-1.5 text-[11px] font-medium text-navy-400">+{overflow} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
