import Link from "next/link";
import { cn } from "@/lib/cn";
import type { CalendarEvent } from "@/lib/data/calendar";

const KIND_PILL_CLASS: Record<CalendarEvent["kind"], string> = {
  FOLLOW_UP: "bg-burnt-100 text-burnt-700 hover:bg-burnt-200",
  MEETING: "bg-navy-100 text-navy-700 hover:bg-navy-200",
  TASK: "bg-gold-100 text-gold-600 hover:brightness-95",
  EXTERNAL: "bg-slate-100 text-slate-600",
};

export function CalendarPill({ event, truncate = true }: { event: CalendarEvent; truncate?: boolean }) {
  const label = event.ownerName ? `${event.title} — ${event.ownerName}` : event.title;
  const fullLabel = event.time ? `${event.time} · ${label}` : label;
  const className = cn(
    "block rounded px-1.5 py-0.5 text-[11px] font-medium leading-tight transition-colors",
    truncate ? "truncate" : "whitespace-normal",
    KIND_PILL_CLASS[event.kind],
    event.completed && "opacity-50 line-through"
  );
  const children = (
    <>
      {event.time && <span className="font-normal opacity-70">{event.time} · </span>}
      {label}
    </>
  );

  // An EXTERNAL event was imported from someone's connected calendar — there's no in-app record
  // for it, so it isn't a link, just a "here's what's on their plate" indicator.
  if (!event.href) {
    return (
      <div title={fullLabel} className={className}>
        {children}
      </div>
    );
  }

  return (
    <Link href={event.href} title={fullLabel} className={className}>
      {children}
    </Link>
  );
}
