import Link from "next/link";
import { Receipt, Clock } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS = [
  { key: "revenue", href: "/invoices", label: "Revenue Tracking", icon: Receipt },
  { key: "tracker", href: "/tracker", label: "Hour & Cost Tracker", icon: Clock },
] as const;

/**
 * Owner-only switcher between the two pages that make up "Finance" in the
 * sidebar — Revenue Tracking (/invoices) and Hour & Cost Tracker (/tracker)
 * stay separate routes (each with its own filters, pagination, and data
 * fetching) rather than one merged page, so only the active tab's page ever
 * loads its data. Team members only ever reach /tracker directly and never
 * see this switcher, since Revenue Tracking is owner-only.
 */
export function FinanceTabs({ active }: { active: "revenue" | "tracker" }) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-sm font-medium shadow-[0_1px_2px_rgba(16,29,51,0.04)] transition-all",
              isActive
                ? "border-burnt-300 bg-burnt-50 text-burnt-700"
                : "border-navy-100 bg-white text-navy-700 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-md"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                isActive ? "bg-burnt-100 text-burnt-600" : "bg-navy-100 text-navy-600"
              )}
            >
              <tab.icon size={15} />
            </span>
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
