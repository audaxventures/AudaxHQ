"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquare, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
];

export function AdminSubNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-6 flex gap-1 border-b border-navy-100">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              active ? "border-burnt-500 text-navy-900" : "border-transparent text-navy-500 hover:text-navy-800"
            )}
          >
            <Icon size={15} className={active ? "text-burnt-600" : "text-navy-400"} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
