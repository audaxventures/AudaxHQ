import Link from "next/link";
import { List, LayoutGrid } from "lucide-react";
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

function ViewToggleButton({
  href,
  active,
  label,
  children,
}: {
  href: string;
  active: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
        active ? "bg-navy-900 text-cream-50" : "text-navy-400 hover:bg-navy-100"
      )}
    >
      {children}
    </Link>
  );
}

export function ClientFilterBar({
  status,
  type,
  view,
}: {
  status?: string;
  type?: string;
  view?: string;
}) {
  const current = { status, type, view };
  const isGrid = view === "grid";
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
          Archived
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
      <div className="ml-auto flex items-center gap-1 rounded-xl border border-navy-200 bg-white p-1">
        <ViewToggleButton href={buildHref(current, "view", undefined)} active={!isGrid} label="List view">
          <List size={16} />
        </ViewToggleButton>
        <ViewToggleButton href={buildHref(current, "view", "grid")} active={isGrid} label="Grid view">
          <LayoutGrid size={16} />
        </ViewToggleButton>
      </div>
    </div>
  );
}
