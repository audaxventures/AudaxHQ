import { LogOut } from "lucide-react";
import { NAV_LINKS } from "@/components/nav/nav-links";
import { NavLink } from "@/components/nav/NavLink";

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:shrink-0 bg-navy-900 px-4 py-6">
      <div className="mb-8 px-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded logo, dimensions unknown */}
        <img src="/logo.png" alt="Audax Ventures" className="h-16 w-auto mb-2" />
        <p className="font-heading text-xl font-medium text-burnt-400">Audax HQ</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_LINKS.map((link) => (
          <NavLink key={link.href} {...link} />
        ))}
      </nav>
      <form action="/api/logout" method="post">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-navy-400 transition-colors hover:bg-navy-800/60 hover:text-cream-100 cursor-pointer"
        >
          <LogOut size={18} strokeWidth={1.75} />
          Sign out
        </button>
      </form>
    </aside>
  );
}
