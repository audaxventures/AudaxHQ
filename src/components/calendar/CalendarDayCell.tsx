"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { Modal } from "@/components/ui/Modal";
import { CalendarPill } from "@/components/calendar/CalendarPill";
import type { CalendarEvent } from "@/lib/data/calendar";

const MAX_PILLS_PER_DAY = 3;

export function CalendarDayCell({
  date,
  day,
  inCurrentMonth,
  isToday,
  events,
}: {
  date: string;
  day: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}) {
  const [open, setOpen] = useState(false);
  const visible = events.slice(0, MAX_PILLS_PER_DAY);
  const overflow = events.length - visible.length;

  return (
    <div
      className={cn(
        "min-h-[92px] sm:min-h-[108px] border-b border-r border-navy-100 p-1.5 [&:nth-child(7n)]:border-r-0",
        !inCurrentMonth && "bg-cream-100/40"
      )}
    >
      <p
        className={cn(
          "mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium",
          isToday ? "bg-burnt-500 text-cream-50" : inCurrentMonth ? "text-navy-700" : "text-navy-300"
        )}
      >
        {day}
      </p>
      <div className="space-y-1">
        {visible.map((event) => (
          <CalendarPill key={`${event.kind}-${event.id}`} event={event} />
        ))}
        {overflow > 0 && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="block w-full px-1.5 text-left text-[11px] font-medium text-navy-400 hover:text-navy-700 hover:underline cursor-pointer"
          >
            +{overflow} more
          </button>
        )}
      </div>
      {open && (
        <Modal onClose={() => setOpen(false)} title={formatDate(date)}>
          <div className="space-y-1.5">
            {events.map((event) => (
              <CalendarPill key={`${event.kind}-${event.id}`} event={event} truncate={false} />
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
