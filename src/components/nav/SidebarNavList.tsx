import { LogOut } from "lucide-react";
import { NAV_LINKS } from "@/components/nav/nav-links";
import { NavLink } from "@/components/nav/NavLink";
import { cn } from "@/lib/cn";
import type { SessionRole } from "@/lib/types";

/** Revenue Tracking (under the Finance nav entry) holds owner-only client billing data — team members land on the Hour & Cost Tracker instead (proxy.ts also blocks direct navigation to /invoices as a second layer). */
const FINANCE_HREF = "/invoices";
const FINANCE_HREF_FOR_TEAM_MEMBER = "/tracker";

function getGroup(link: Record<string, unknown>): string | undefined {
  return typeof link.group === "string" ? link.group : undefined;
}

/** The nav-links + Settings + Sign out block shared by the desktop sidebar and the mobile drawer. */
export function SidebarNavList({
  role,
  hasPartnersAccess,
  isAdmin,
  onNavigate,
  collapsed,
}: {
  role: SessionRole;
  /** Owner-only visually redundant (the owner always has access) — only matters for a team member. Gates the Partners nav link the same way team_members.has_partners_access gates the page itself (see migration 046). */
  hasPartnersAccess?: boolean;
  /** Platform-admin status — an axis orthogonal to role (see isPlatformAdmin in src/lib/currentUser.ts), so it's a separate prop rather than a third role value. */
  isAdmin?: boolean;
  onNavigate?: () => void;
  /** Icon-only rail mode — only meaningful for the desktop sidebar; the mobile drawer never passes this. */
  collapsed?: boolean;
}) {
  const links =
    role === "OWNER"
      ? NAV_LINKS
      : NAV_LINKS.filter((link) => hasPartnersAccess || link.href !== "/partners").map((link) =>
          link.href === FINANCE_HREF ? { ...link, href: FINANCE_HREF_FOR_TEAM_MEMBER } : link
        );
  return (
    <>
      <nav className="relative flex flex-col gap-1">
        {links.map((link, i) => {
          const group = getGroup(link);
          const prevGroup = i > 0 ? getGroup(links[i - 1]) : undefined;
          const isNewGroup = group !== undefined && group !== prevGroup;
          return (
            <div key={link.href}>
              {isNewGroup &&
                (collapsed ? (
                  <div className="mx-1 mt-2 mb-1.5 border-t border-navy-300/20" />
                ) : (
                  <p className="mt-3 mb-1 px-3.5 text-[11px] font-semibold uppercase tracking-wider text-navy-400/70">
                    {group}
                  </p>
                ))}
              <NavLink {...link} onClick={onNavigate} collapsed={collapsed} />
            </div>
          );
        })}
      </nav>
      <div className="relative mt-1 border-t border-navy-300/20 pt-1">
        {/* Settings is mostly owner-only, but Notifications (and Billing)
            are explicitly self-service for a team member too (see
            proxy.ts's TEAM_MEMBER_ACCESSIBLE_EXCEPTIONS) — send them
            straight there instead of /settings, which just redirects to
            the owner-only Profile tab they can't reach. */}
        <NavLink
          href={role === "OWNER" ? "/settings" : "/settings/notifications"}
          label="Settings"
          icon="settings"
          onClick={onNavigate}
          collapsed={collapsed}
        />
      </div>
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
