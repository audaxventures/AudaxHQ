"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

const STORAGE_PREFIX = "record-section-tab:";

export type SectionTabColor = "burnt" | "gold" | "sage" | "slate" | "navy" | "blue" | "violet" | "teal";

const TAB_COLOR_CLASSES: Record<SectionTabColor, { icon: string; active: string }> = {
  burnt: { icon: "bg-burnt-100 text-burnt-600", active: "border-burnt-300 bg-burnt-50 text-burnt-700" },
  gold: { icon: "bg-gold-100 text-gold-600", active: "border-gold-300 bg-gold-50 text-gold-700" },
  sage: { icon: "bg-sage-100 text-sage-600", active: "border-sage-300 bg-sage-50 text-sage-700" },
  slate: { icon: "bg-slate-100 text-slate-600", active: "border-slate-300 bg-slate-50 text-slate-700" },
  navy: { icon: "bg-navy-100 text-navy-700", active: "border-navy-300 bg-navy-50 text-navy-800" },
  blue: { icon: "bg-blue-100 text-blue-600", active: "border-blue-300 bg-blue-50 text-blue-700" },
  violet: { icon: "bg-violet-100 text-violet-600", active: "border-violet-300 bg-violet-50 text-violet-700" },
  teal: { icon: "bg-teal-100 text-teal-600", active: "border-teal-300 bg-teal-50 text-teal-700" },
};

export interface SectionTab {
  key: string;
  label: string;
  /** A rendered icon element (e.g. `<Receipt size={15} />`), not the bare component — this is a Client Component, and only rendered elements (not component references) can cross the Server → Client boundary as a prop. */
  icon: React.ReactNode;
  color: SectionTabColor;
  count: number;
  content: React.ReactNode;
}

/**
 * Replaces a stack of always-mounted CollapsibleSections with a single
 * switcher — only the active tab's content renders, so getting to
 * "Documents" on a client with a long history no longer means scrolling
 * past four other sections first. The active tab is remembered per browser
 * (not per client/lead record) the same way CollapsibleSection remembers
 * open/closed state, so a habitual "I always check Meetings first" carries
 * across every record of this type.
 */
export function RecordSectionTabs({ storageKey, tabs }: { storageKey: string; tabs: SectionTab[] }) {
  const [activeKey, setActiveKey] = useState(tabs[0]?.key ?? "");

  useEffect(() => {
    // Server-rendered default is the first tab (localStorage doesn't exist
    // during SSR) — this only fires client-side to correct it from a stored
    // preference, so the initial render still matches what was hydrated.
    const stored = localStorage.getItem(STORAGE_PREFIX + storageKey);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, an external source SSR can't see
    if (stored && tabs.some((t) => t.key === stored)) setActiveKey(stored);
  }, [storageKey, tabs]);

  function selectTab(key: string) {
    setActiveKey(key);
    localStorage.setItem(STORAGE_PREFIX + storageKey, key);
  }

  const activeTab = tabs.find((t) => t.key === activeKey) ?? tabs[0];

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
        {tabs.map((tab) => {
          const active = tab.key === activeTab?.key;
          const colors = TAB_COLOR_CLASSES[tab.color];
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => selectTab(tab.key)}
              aria-pressed={active}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-sm font-medium shadow-[0_1px_2px_rgba(16,29,51,0.04)] transition-all cursor-pointer",
                active
                  ? colors.active
                  : "border-navy-100 bg-white text-navy-700 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-md"
              )}
            >
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", colors.icon)}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                    active ? "bg-white/60" : "bg-navy-100 text-navy-500"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <Card className="mt-4 p-6">{activeTab?.content}</Card>
    </div>
  );
}
