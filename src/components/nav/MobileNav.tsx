import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { NAV_LINKS } from "@/components/nav/nav-links";
import { NavLink } from "@/components/nav/NavLink";

export function MobileTopBar() {
  return (
    <header className="flex md:hidden items-center justify-between bg-navy-900 px-4 py-3 sticky top-0 z-20">
      <div className="flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded logo, dimensions unknown */}
        <img src="/logo.white.png" alt="Audax Ventures" className="h-6 w-auto" />
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
  );
}

export function MobileTabBar() {
  return (
    <nav className="flex md:hidden fixed bottom-0 inset-x-0 z-20 border-t border-navy-100 bg-cream-50/95 backdrop-blur px-2 pb-[env(safe-area-inset-bottom)]">
      {NAV_LINKS.map((link) => (
        <NavLink key={link.href} {...link} variant="tab" />
      ))}
    </nav>
  );
}
