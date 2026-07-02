import Link from "next/link";
import { cn } from "@/lib/cn";
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER } from "@/lib/types";

function FilterPill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm font-medium transition-colors border whitespace-nowrap",
        active
          ? "bg-navy-900 text-cream-50 border-navy-900"
          : "bg-transparent text-navy-600 border-navy-200 hover:border-navy-400"
      )}
    >
      {children}
    </Link>
  );
}

export function LeadFilterBar({ status }: { status?: string }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto">
      <FilterPill href="/leads" active={!status}>
        All
      </FilterPill>
      {LEAD_STATUS_ORDER.map((s) => (
        <FilterPill key={s} href={`/leads?status=${s}`} active={status === s}>
          {LEAD_STATUS_LABELS[s]}
        </FilterPill>
      ))}
    </div>
  );
}
