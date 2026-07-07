import { Calendar as CalendarIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { CalendarControls } from "@/components/calendar/CalendarControls";
import { CalendarDayCell } from "@/components/calendar/CalendarDayCell";
import { buildMonthGrid, parseMonthParam, todayDateStr } from "@/lib/calendarGrid";
import { listCalendarEvents, CALENDAR_EVENT_KIND_ORDER, type CalendarEventKind } from "@/lib/data/calendar";
import { accessibleClientIdsFor } from "@/lib/data/clientAccess";
import { requireCurrentUser } from "@/lib/currentUser";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
  const user = await requireCurrentUser();
  const timezone = user.business.timezone;
  const { year, month } = parseMonthParam(monthParamValue, timezone);
  const activeTypes = parseTypesParam(typesParamValue);
  const grid = buildMonthGrid(year, month);
  const today = todayDateStr(timezone);

  const teamMember = user.role === "TEAM_MEMBER" ? user.teamMember : null;
  const accessibleClientIds = await accessibleClientIdsFor(user);

  const allEvents = await listCalendarEvents(user.businessId, grid[0].date, grid[grid.length - 1].date, {
    restrictToTeamMemberId: teamMember?.id,
    accessibleClientIds,
  });
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
        icon={CalendarIcon}
        tone="navy"
        eyebrow="Calendar"
        title="Calendar"
        description="Follow-ups, meeting notes, and task due dates, all in one place."
      />

      <CalendarControls year={year} month={month} activeTypes={activeTypes} today={today} />

      <Card tone="navy" className="overflow-hidden">
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
          {grid.map((day) => (
            <CalendarDayCell
              key={day.date}
              date={day.date}
              day={day.day}
              inCurrentMonth={day.inCurrentMonth}
              isToday={day.date === today}
              events={eventsByDate.get(day.date) ?? []}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
