import Link from "next/link";
import { cn } from "@/lib/cn";

function buildHref(current: Record<string, string | undefined>, key: string, value: string | undefined) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    if (v && k !== key) params.set(k, v);
  }
  if (value) params.set(key, value);
  const qs = params.toString();
  return qs ? `/clients?${qs}` : "/clients";
}

function FilterPill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm font-medium transition-colors border",
        active
          ? "bg-navy-900 text-cream-50 border-navy-900"
          : "bg-transparent text-navy-600 border-navy-200 hover:border-navy-400"
      )}
    >
      {children}
    </Link>
  );
}

export function ClientFilterBar({
  status,
  type,
}: {
  status?: string;
  type?: string;
}) {
  const current = { status, type };
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <div className="flex flex-wrap gap-2">
        <FilterPill href={buildHref(current, "status", undefined)} active={!status}>
          All statuses
        </FilterPill>
        <FilterPill href={buildHref(current, "status", "ACTIVE")} active={status === "ACTIVE"}>
          Active
        </FilterPill>
        <FilterPill href={buildHref(current, "status", "PAUSED")} active={status === "PAUSED"}>
          Paused
        </FilterPill>
        <FilterPill href={buildHref(current, "status", "CHURNED")} active={status === "CHURNED"}>
          Churned
        </FilterPill>
      </div>
      <span className="w-px h-5 bg-navy-200 mx-1 hidden sm:block" />
      <div className="flex flex-wrap gap-2">
        <FilterPill href={buildHref(current, "type", undefined)} active={!type}>
          All types
        </FilterPill>
        <FilterPill href={buildHref(current, "type", "PROJECT")} active={type === "PROJECT"}>
          Project
        </FilterPill>
        <FilterPill href={buildHref(current, "type", "RECURRING")} active={type === "RECURRING"}>
          Recurring
        </FilterPill>
      </div>
    </div>
  );
}
