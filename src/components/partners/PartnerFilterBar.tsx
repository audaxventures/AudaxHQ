import Link from "next/link";
import { cn } from "@/lib/cn";
import { ViewToggle } from "@/components/ui/ViewToggle";

function buildHref(current: Record<string, string | undefined>, key: string, value: string | undefined) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    if (v && k !== key) params.set(k, v);
  }
  if (value) params.set(key, value);
  const qs = params.toString();
  return qs ? `/partners?${qs}` : "/partners";
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

export function PartnerFilterBar({ status, view }: { status?: string; view?: string }) {
  const current = { status, view };
  const isGrid = view === "grid";
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <div className="flex flex-wrap gap-2">
        <FilterPill href={buildHref(current, "status", undefined)} active={!status}>
          Active
        </FilterPill>
        <FilterPill href={buildHref(current, "status", "all")} active={status === "all"}>
          All partners
        </FilterPill>
      </div>
      <ViewToggle
        isGrid={isGrid}
        listHref={buildHref(current, "view", undefined)}
        gridHref={buildHref(current, "view", "grid")}
        storageKey="partners-view"
      />
    </div>
  );
}
