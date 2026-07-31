"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Target,
  CheckSquare,
  NotebookPen,
  CalendarClock,
  DollarSign,
  BarChart3,
  Settings,
  ShieldCheck,
  Handshake,
  UserSearch,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { NavIconKey } from "@/components/nav/nav-links";

const ICONS = {
  dashboard: LayoutDashboard,
  clients: Users,
  leads: Target,
  prospects: UserSearch,
  leadAnalytics: BarChart3,
  meetingNotes: NotebookPen,
  followUps: CalendarClock,
  finance: DollarSign,
  todos: CheckSquare,
  partners: Handshake,
  settings: Settings,
  admin: ShieldCheck,
} as const satisfies Record<NavIconKey, unknown>;

export function NavLink({
  href,
  label,
  tabLabel,
  icon,
  variant = "sidebar",
  onClick,
  matchPrefixes,
  collapsed,
}: {
  href: string;
  label: string;
  tabLabel?: string;
  icon: NavIconKey;
  variant?: "sidebar" | "tab";
  onClick?: () => void;
  /** Extra path prefixes that should also count as "active" for this link, e.g. a merged nav entry whose sub-pages live under different routes. Defaults to just `href`. */
  matchPrefixes?: readonly string[];
  /** Icon-only rendering for the collapsed desktop sidebar — only meaningful for variant="sidebar". */
  collapsed?: boolean;
}) {
  const Icon = ICONS[icon];
  const pathname = usePathname();
  const prefixes = matchPrefixes ?? [href];
  const active = href === "/" ? pathname === "/" : prefixes.some((p) => pathname.startsWith(p));

  if (variant === "tab") {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
          active ? "text-burnt-500" : "text-navy-400"
        )}
      >
        <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
        {tabLabel ?? label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-colors",
        collapsed ? "justify-center px-2.5" : "px-3.5",
        active
          ? "bg-navy-800 text-cream-50"
          : "text-navy-300 hover:bg-navy-800/60 hover:text-cream-100"
      )}
    >
      <Icon size={18} strokeWidth={active ? 2.25 : 1.75} />
      {!collapsed && label}
      {active && <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-burnt-500" />}
    </Link>
  );
}
