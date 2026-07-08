import { LogOut } from "lucide-react";
import { NAV_LINKS } from "@/components/nav/nav-links";
import { NavLink } from "@/components/nav/NavLink";
import type { SessionRole } from "@/lib/types";

/** Revenue Tracking and Settings hold owner-only client billing/workspace configuration — hidden from the nav entirely for team members (proxy.ts also blocks direct navigation as a second layer). */
const OWNER_ONLY_HREFS = ["/invoices"];

/** The nav-links + Settings + Sign out block shared by the desktop sidebar and the mobile drawer. */
export function SidebarNavList({
  role,
  isAdmin,
  onNavigate,
}: {
  role: SessionRole;
  /** Platform-admin status — an axis orthogonal to role (see isPlatformAdmin in src/lib/currentUser.ts), so it's a separate prop rather than a third role value. */
  isAdmin?: boolean;
  onNavigate?: () => void;
}) {
  const links = role === "OWNER" ? NAV_LINKS : NAV_LINKS.filter((link) => !OWNER_ONLY_HREFS.includes(link.href));
  return (
    <>
      <nav className="relative flex flex-col gap-1">
        {links.map((link) => (
          <NavLink key={link.href} {...link} onClick={onNavigate} />
        ))}
      </nav>
      {role === "OWNER" && (
        <div className="relative mt-1 border-t border-navy-300/20 pt-1">
          <NavLink href="/settings" label="Settings" icon="settings" onClick={onNavigate} />
        </div>
      )}
      {isAdmin && (
        <div className="relative mt-1 border-t border-navy-300/20 pt-1">
          <NavLink href="/admin" label="Admin" icon="admin" onClick={onNavigate} />
        </div>
      )}
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
