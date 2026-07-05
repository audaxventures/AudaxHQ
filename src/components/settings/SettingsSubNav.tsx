"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/business", label: "Business Info" },
  { href: "/settings/team-members", label: "Team Members" },
  { href: "/settings/work-categories", label: "Work Categories" },
  { href: "/settings/work-types", label: "Work Types" },
  { href: "/settings/lead-sources", label: "Lead Sources" },
  { href: "/settings/todo-types", label: "To-Do Types" },
  { href: "/settings/invoice-aging", label: "Invoice Aging" },
  { href: "/settings/passcode", label: "Access" },
  { href: "/settings/data-export", label: "Data Export" },
];

export function SettingsSubNav() {
  const pathname = usePathname();
  return (
    <div className="mb-6 flex flex-wrap gap-2 overflow-x-auto">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-navy-900 bg-navy-900 text-cream-50"
                : "border-navy-200 bg-transparent text-navy-600 hover:border-navy-400"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
