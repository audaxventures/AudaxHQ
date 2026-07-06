import { LogOut } from "lucide-react";
import { NAV_LINKS } from "@/components/nav/nav-links";
import { NavLink } from "@/components/nav/NavLink";

/** The nav-links + Settings + Sign out block shared by the desktop sidebar and the mobile drawer. */
export function SidebarNavList({ onNavigate }: { onNavigate?: () => void } = {}) {
  return (
    <>
      <nav className="relative flex flex-col gap-1">
        {NAV_LINKS.map((link) => (
          <NavLink key={link.href} {...link} onClick={onNavigate} />
        ))}
      </nav>
      <div className="relative mt-1 border-t border-navy-300/20 pt-1">
        <NavLink href="/settings" label="Settings" icon="settings" onClick={onNavigate} />
      </div>
      <form action="/api/logout" method="post" className="relative mt-1">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-navy-400 transition-colors hover:bg-navy-800/60 hover:text-cream-100 cursor-pointer"
        >
          <LogOut size={18} strokeWidth={1.75} />
          Sign out
        </button>
      </form>
    </>
  );
}
