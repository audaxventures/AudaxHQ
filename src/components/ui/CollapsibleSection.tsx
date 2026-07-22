"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { ICON_TONE_CLASSES, type IconTone } from "@/lib/tone";

const STORAGE_PREFIX = "section-collapsed:";

/**
 * A Card + PanelHeading-style section whose body can be collapsed. The open
 * state is per section identity (sectionKey), not per client/lead — stored
 * in localStorage so "I never use Documents" is a one-time decision that
 * applies on every client/lead page, not something re-toggled per record.
 * With no stored preference yet, a section defaults open unless `isEmpty` is
 * true, in which case it starts collapsed until there's something in it.
 */
export function CollapsibleSection({
  sectionKey,
  icon,
  tone,
  title,
  action,
  isEmpty,
  className,
  children,
}: {
  sectionKey: string;
  /** A rendered icon element (e.g. `<Receipt size={14} />`), not the bare component — this is a Client Component, and only rendered elements (not component references) can cross the Server → Client boundary as a prop. */
  icon: React.ReactNode;
  tone: IconTone;
  title: string;
  action?: React.ReactNode;
  isEmpty: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!isEmpty);

  useEffect(() => {
    // Server-rendered default is !isEmpty (localStorage doesn't exist during
    // SSR) — this only fires client-side to correct it from a stored
    // preference, so the initial render still matches what was hydrated.
    // Only the stored preference (or its absence) should move this away from
    // that guess — re-running on every isEmpty change would fight a user's
    // explicit choice as data comes and goes.
    const stored = localStorage.getItem(STORAGE_PREFIX + sectionKey);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, an external source SSR can't see
    if (stored !== null) setOpen(stored === "open");
  }, [sectionKey]);

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_PREFIX + sectionKey, next ? "open" : "closed");
      return next;
    });
  }

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 mb-3">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="flex cursor-pointer items-center gap-2.5 text-left"
        >
          <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px]", ICON_TONE_CLASSES[tone])}>
            {icon}
          </div>
          <h3 className="font-heading text-base font-medium text-navy-900">{title}</h3>
          <ChevronDown
            size={16}
            className={cn("text-navy-400 transition-transform", !open && "-rotate-90")}
          />
        </button>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {open && children}
    </Card>
  );
}
