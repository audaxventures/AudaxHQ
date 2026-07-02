import { LogOut } from "lucide-react";
import { NAV_LINKS } from "@/components/nav/nav-links";
import { NavLink } from "@/components/nav/NavLink";

export function MobileTopBar() {
  return (
    <header className="flex md:hidden items-center justify-between border-b border-navy-100 bg-cream-50/90 px-4 py-3 backdrop-blur sticky top-0 z-20">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-burnt-500">
          Audax Ventures
        </p>
        <p className="font-heading text-lg font-medium text-navy-900 -mt-0.5">Audax HQ</p>
      </div>
      <form action="/api/logout" method="post">
        <button
          type="submit"
          aria-label="Sign out"
          className="flex items-center justify-center rounded-full p-2 text-navy-500 hover:bg-navy-100 cursor-pointer"
        >
          <LogOut size={18} strokeWidth={1.75} />
        </button>
      </form>
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
