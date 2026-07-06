"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Menu, Settings } from "lucide-react";
import { MOBILE_TAB_LINKS } from "@/components/nav/nav-links";
import { NavLink } from "@/components/nav/NavLink";
import { MobileSidebarDrawer } from "@/components/nav/MobileSidebarDrawer";

export function MobileTopBar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="flex md:hidden items-center justify-between bg-navy-900 px-4 py-3 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="flex items-center justify-center rounded-full p-2 text-navy-300 hover:bg-navy-800/60 hover:text-cream-100 cursor-pointer"
          >
            <Menu size={20} strokeWidth={1.75} />
          </button>
          <p className="font-heading text-lg font-medium text-burnt-400">Audax HQ</p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex items-center justify-center rounded-full p-2 text-navy-300 hover:bg-navy-800/60 hover:text-cream-100"
          >
            <Settings size={18} strokeWidth={1.75} />
          </Link>
          <form action="/api/logout" method="post">
            <button
              type="submit"
              aria-label="Sign out"
              className="flex items-center justify-center rounded-full p-2 text-navy-300 hover:bg-navy-800/60 hover:text-cream-100 cursor-pointer"
            >
              <LogOut size={18} strokeWidth={1.75} />
            </button>
          </form>
        </div>
      </header>
      {drawerOpen && <MobileSidebarDrawer onClose={() => setDrawerOpen(false)} />}
    </>
  );
}

export function MobileTabBar() {
  return (
    <nav className="flex md:hidden fixed bottom-0 inset-x-0 z-20 border-t border-navy-100 bg-cream-50/95 backdrop-blur px-2 pb-[env(safe-area-inset-bottom)]">
      {MOBILE_TAB_LINKS.map((link) => (
        <NavLink key={link.href} {...link} variant="tab" />
      ))}
    </nav>
  );
}
