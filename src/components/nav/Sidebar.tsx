"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SidebarNavList } from "@/components/nav/SidebarNavList";
import { initials } from "@/lib/avatar";
import { cn } from "@/lib/cn";
import type { SessionRole } from "@/lib/types";

const STORAGE_KEY = "sidebar-collapsed";

export function Sidebar({
  role,
  isAdmin,
  businessName,
}: {
  role: SessionRole;
  isAdmin?: boolean;
  businessName: string;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Server-rendered default is expanded (localStorage doesn't exist during
    // SSR) — this only fires client-side to correct it from a stored
    // preference, so the initial render still matches what was hydrated.
    const stored = localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, an external source SSR can't see
    if (stored === "1") setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "sticky top-3 hidden h-[calc(100dvh-1.5rem)] overflow-y-auto overflow-x-hidden bg-navy-900 bg-cover bg-center py-6 shadow-[0_1px_2px_rgba(16,29,51,0.04),0_20px_40px_-24px_rgba(16,29,51,0.45)] transition-[width] duration-200 ease-in-out md:ml-3 md:flex md:shrink-0 md:flex-col md:rounded-[20px]",
        collapsed ? "md:w-[76px] px-2.5" : "md:w-60 px-4"
      )}
      style={{ backgroundImage: "url('/sidebar.png')" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,20,36,0.45) 0%, rgba(10,20,36,0.55) 45%, rgba(10,20,36,0.82) 100%)",
        }}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-8 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-navy-200 bg-cream-50 text-navy-500 shadow-sm transition-all hover:text-navy-800 hover:shadow-md cursor-pointer"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
      <div className={cn("relative mb-6 border-b border-navy-800/60 pt-4 pb-5", collapsed ? "px-0" : "px-2")}>
        {collapsed ? (
          <div className="flex justify-center" title={businessName}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-burnt-500/90 font-heading text-sm font-semibold text-cream-50">
              {initials(businessName)}
            </div>
          </div>
        ) : (
          <>
            <p className="font-heading text-2xl font-semibold text-cream-100 leading-tight truncate">{businessName}</p>
            <p className="mt-1.5 text-xs italic text-burnt-400">Your business command centre</p>
          </>
        )}
      </div>
      <SidebarNavList role={role} isAdmin={isAdmin} collapsed={collapsed} />
    </aside>
  );
}
