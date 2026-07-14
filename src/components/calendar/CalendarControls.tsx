import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { monthLabel, monthParam, shiftMonth } from "@/lib/calendarGrid";
import { CALENDAR_EVENT_KIND_LABELS, CALENDAR_EVENT_KIND_ORDER, type CalendarEventKind } from "@/lib/data/calendar";

function buildHref(month: string, types: Set<CalendarEventKind>) {
  const params = new URLSearchParams();
  params.set("month", month);
  if (types.size < CALENDAR_EVENT_KIND_ORDER.length) {
    params.set("types", Array.from(types).join(","));
  }
  const qs = params.toString();
  return qs ? `/calendar?${qs}` : "/calendar";
}

export function CalendarControls({
  year,
  month,
  activeTypes,
  today,
}: {
  year: number;
  month: number;
  activeTypes: Set<CalendarEventKind>;
  today: string;
}) {
  const prevMonth = shiftMonth(year, month, -1);
  const nextMonth = shiftMonth(year, month, 1);
  const thisMonthParam = monthParam(year, month);
  const currentMonthOfToday = today.slice(0, 7);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div className="flex items-center gap-2">
        <Link
          href={buildHref(monthParam(prevMonth.year, prevMonth.month), activeTypes)}
          className="flex items-center justify-center rounded-lg border border-navy-200 p-1.5 text-navy-500 hover:bg-navy-100 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </Link>
        <h2 className="font-heading text-xl font-medium text-navy-900 w-44 text-center">
          {monthLabel(year, month)}
        </h2>
        <Link
          href={buildHref(monthParam(nextMonth.year, nextMonth.month), activeTypes)}
          className="flex items-center justify-center rounded-lg border border-navy-200 p-1.5 text-navy-500 hover:bg-navy-100 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </Link>
        {thisMonthParam !== currentMonthOfToday && (
          <Link
            href={buildHref(currentMonthOfToday, activeTypes)}
            className="ml-1 text-sm font-medium text-burnt-600 hover:underline"
          >
            Today
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {CALENDAR_EVENT_KIND_ORDER.map((kind) => {
          const active = activeTypes.has(kind);
          const next = new Set(activeTypes);
          if (active) next.delete(kind);
          else next.add(kind);
          // Never allow toggling down to zero visible types.
          const href = next.size === 0 ? buildHref(thisMonthParam, activeTypes) : buildHref(thisMonthParam, next);
          return (
            <Link
              key={kind}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors border whitespace-nowrap",
                active
                  ? "bg-navy-900 text-cream-50 border-navy-900"
                  : "bg-transparent text-navy-400 border-navy-200 hover:border-navy-400"
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", KIND_DOT_CLASS[kind])} />
              {CALENDAR_EVENT_KIND_LABELS[kind]}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export const KIND_DOT_CLASS: Record<CalendarEventKind, string> = {
  FOLLOW_UP: "bg-burnt-500",
  MEETING: "bg-navy-500",
  TASK: "bg-gold-600",
  EXTERNAL: "bg-slate-400",
};
