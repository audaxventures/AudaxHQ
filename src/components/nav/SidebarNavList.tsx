import { LogOut } from "lucide-react";
import { NAV_LINKS } from "@/components/nav/nav-links";
import { NavLink } from "@/components/nav/NavLink";
import { cn } from "@/lib/cn";
import type { SessionRole } from "@/lib/types";

/** Revenue Tracking (under the Finance nav entry) holds owner-only client billing data — team members land on the Hour & Cost Tracker instead (proxy.ts also blocks direct navigation to /invoices as a second layer). */
const FINANCE_HREF = "/invoices";
const FINANCE_HREF_FOR_TEAM_MEMBER = "/tracker";

/** The nav-links + Settings + Sign out block shared by the desktop sidebar and the mobile drawer. */
export function SidebarNavList({
  role,
  isAdmin,
  onNavigate,
  collapsed,
}: {
  role: SessionRole;
  /** Platform-admin status — an axis orthogonal to role (see isPlatformAdmin in src/lib/currentUser.ts), so it's a separate prop rather than a third role value. */
  isAdmin?: boolean;
  onNavigate?: () => void;
  /** Icon-only rail mode — only meaningful for the desktop sidebar; the mobile drawer never passes this. */
  collapsed?: boolean;
}) {
  const links =
    role === "OWNER"
      ? NAV_LINKS
      : NAV_LINKS.map((link) => (link.href === FINANCE_HREF ? { ...link, href: FINANCE_HREF_FOR_TEAM_MEMBER } : link));
  return (
    <>
      <nav className="relative flex flex-col gap-1">
        {links.map((link) => (
          <NavLink key={link.href} {...link} onClick={onNavigate} collapsed={collapsed} />
        ))}
      </nav>
      {role === "OWNER" && (
        <div className="relative mt-1 border-t border-navy-300/20 pt-1">
          <NavLink href="/settings" label="Settings" icon="settings" onClick={onNavigate} collapsed={collapsed} />
        </div>
      )}
      {isAdmin && (
        <div className="relative mt-1 border-t border-navy-300/20 pt-1">
          <NavLink href="/admin" label="Admin" icon="admin" onClick={onNavigate} collapsed={collapsed} />
        </div>
      )}
      <form action="/api/logout" method="post" className="relative mt-1">
        <button
          type="submit"
          title={collapsed ? "Sign out" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl py-2.5 text-sm font-medium text-navy-400 transition-colors hover:bg-navy-800/60 hover:text-cream-100 cursor-pointer",
            collapsed ? "justify-center px-2.5" : "px-3.5"
          )}
        >
          <LogOut size={18} strokeWidth={1.75} />
          {!collapsed && "Sign out"}
        </button>
      </form>
    </>
  );
}
