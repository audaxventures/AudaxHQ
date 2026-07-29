"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Client } from "@/lib/types";

// Rendered row height (AvatarChip's h-8 = 32px, plus each row's py-2.5 = 20px)
// — used as a fallback before the first real row has rendered to measure from.
const FALLBACK_ROW_HEIGHT_PX = 52;
// Shown before the list-height measurement effect below has run, and also
// the floor it never drops below — this card only has a taller sibling to
// stretch against (and thus real extra room to grow into) in the dashboard's
// two-column desktop grid. On a single-column mobile layout there's no
// sibling forcing its height, so without this floor the measured height (and
// therefore the row count) would collapse toward zero instead of matching
// this card's own default, unstretched size.
const MIN_VISIBLE_CLIENTS = 3;

function TabPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer",
        active
          ? "border-navy-900 bg-navy-900 text-cream-50"
          : "border-navy-200 bg-transparent text-navy-600 hover:border-navy-400"
      )}
    >
      {children}
    </button>
  );
}

export function ClientsPanel({
  recurringClients,
  projectClients,
  hideRate = false,
}: {
  recurringClients: Client[];
  projectClients: Client[];
  hideRate?: boolean;
}) {
  const [tab, setTab] = useState<"RECURRING" | "PROJECT">("RECURRING");
  const clients = tab === "RECURRING" ? recurringClients : projectClients;
  const totalActive = recurringClients.length + projectClients.length;

  // The card's own height is set by CSS Grid stretching it to match its
  // (often taller) dashboard sibling — this list fills whatever of that
  // height isn't taken up by the header/tabs/footer, so it needs to know
  // how many complete rows actually fit rather than showing a fixed count.
  const listRef = useRef<HTMLDivElement>(null);
  const firstRowRef = useRef<HTMLLIElement>(null);
  const [maxVisible, setMaxVisible] = useState(MIN_VISIBLE_CLIENTS);

  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;
    const recalc = () => {
      const rowHeight = firstRowRef.current?.getBoundingClientRect().height || FALLBACK_ROW_HEIGHT_PX;
      const fitted = Math.floor(listEl.getBoundingClientRect().height / rowHeight);
      setMaxVisible(Math.max(MIN_VISIBLE_CLIENTS, fitted));
    };
    recalc();
    // Re-measure whenever the card's stretched height changes — e.g. its
    // sibling growing/shrinking (like the to-do card's Priority/Overdue
    // toggle) or the viewport resizing, not just on mount.
    const observer = new ResizeObserver(recalc);
    observer.observe(listEl);
    return () => observer.disconnect();
  }, []);

  const visibleClients = clients.slice(0, maxVisible);

  return (
    <Card tone="blue" className="flex h-full flex-col p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-blue-100 text-blue-600">
            <Users size={14} />
          </div>
          <h3 className="font-heading text-base font-medium text-navy-900">
            Clients <span className="font-sans text-xs font-normal text-navy-400">({totalActive} active)</span>
          </h3>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <TabPill active={tab === "RECURRING"} onClick={() => setTab("RECURRING")}>
            Monthly Recurring
          </TabPill>
          <TabPill active={tab === "PROJECT"} onClick={() => setTab("PROJECT")}>
            Project
          </TabPill>
        </div>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 overflow-hidden">
        <ul className="divide-y divide-navy-100 -mx-1">
          {visibleClients.length === 0 ? (
            <li className="flex items-center gap-3 rounded-lg px-1 py-2.5">
              <p className="text-sm text-navy-400">
                No active {tab === "RECURRING" ? "recurring" : "project"} clients
              </p>
            </li>
          ) : (
            visibleClients.map((c, i) => (
              <li key={c.id} ref={i === 0 ? firstRowRef : undefined}>
                <Link
                  href={`/clients/${c.id}`}
                  className="flex items-center gap-3 rounded-lg px-1 py-2.5 transition-colors hover:bg-cream-100/60"
                >
                  <AvatarChip name={c.companyName} color={c.color} />
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-navy-900">{c.companyName}</p>
                  {!hideRate && (
                    <span className="shrink-0 text-xs font-medium text-navy-500">
                      {formatCurrency(c.rate)}
                      {tab === "RECURRING" ? "/mo" : ""}
                    </span>
                  )}
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>

      <Link
        href="/clients"
        className="mt-3 inline-flex items-center gap-1 px-1 text-xs font-medium text-burnt-600 hover:underline"
      >
        View all clients <ArrowRight size={12} />
      </Link>
    </Card>
  );
}
