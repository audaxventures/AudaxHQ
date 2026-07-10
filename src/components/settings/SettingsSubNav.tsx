"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Building2,
  Users,
  Folder,
  Tag,
  Target,
  CheckSquare,
  DollarSign,
  Shield,
  Upload,
  MessageSquare,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/settings/profile", label: "Profile", icon: User },
  { href: "/settings/business", label: "Business Info", icon: Building2 },
  { href: "/settings/team-members", label: "Team Members", icon: Users },
  { href: "/settings/work-categories", label: "Work Categories", icon: Folder },
  { href: "/settings/work-types", label: "Work Types", icon: Tag },
  { href: "/settings/lead-sources", label: "Lead Sources", icon: Target },
  { href: "/settings/todo-types", label: "To-Do Types", icon: CheckSquare },
  { href: "/settings/invoice-aging", label: "Invoice Aging", icon: DollarSign },
  { href: "/settings/passcode", label: "Access", icon: Shield },
  { href: "/settings/data-export", label: "Data Export", icon: Upload },
  { href: "/settings/feedback", label: "Feedback", icon: MessageSquare },
];

export function SettingsSubNav() {
  const pathname = usePathname();
  return (
    <Card className="p-2">
      <nav className="flex flex-col gap-0.5">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-burnt-100 text-navy-900" : "text-navy-600 hover:bg-navy-100/60"
              )}
            >
              <Icon size={17} className={active ? "text-burnt-600" : "text-navy-400"} />
              <span className="flex-1">{tab.label}</span>
              {!active && <ChevronRight size={15} className="text-navy-300" />}
            </Link>
          );
        })}
      </nav>
    </Card>
  );
}
