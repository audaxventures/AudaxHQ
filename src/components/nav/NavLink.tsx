"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Target,
  CheckSquare,
  NotebookPen,
  Calendar,
  Receipt,
  BarChart3,
  Clock,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { NavIconKey } from "@/components/nav/nav-links";

const ICONS = {
  dashboard: LayoutDashboard,
  clients: Users,
  leads: Target,
  leadAnalytics: BarChart3,
  meetingNotes: NotebookPen,
  calendar: Calendar,
  invoices: Receipt,
  tracker: Clock,
  todos: CheckSquare,
  settings: Settings,
} as const satisfies Record<NavIconKey, unknown>;

export function NavLink({
  href,
  label,
  tabLabel,
  icon,
  variant = "sidebar",
}: {
  href: string;
  label: string;
  tabLabel?: string;
  icon: NavIconKey;
  variant?: "sidebar" | "tab";
}) {
  const Icon = ICONS[icon];
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  if (variant === "tab") {
    return (
      <Link
        href={href}
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
      className={cn(
        "relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-navy-800 text-cream-50"
          : "text-navy-300 hover:bg-navy-800/60 hover:text-cream-100"
      )}
    >
      <Icon size={18} strokeWidth={active ? 2.25 : 1.75} />
      {label}
      {active && <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-burnt-500" />}
    </Link>
  );
}
