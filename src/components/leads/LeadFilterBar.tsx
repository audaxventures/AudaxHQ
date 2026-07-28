import Link from "next/link";
import { Tag } from "lucide-react";
import { cn } from "@/lib/cn";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER, type LeadSource } from "@/lib/types";

function buildHref(current: Record<string, string | undefined>, key: string, value: string | undefined) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    if (v && k !== key) params.set(k, v);
  }
  if (value) params.set(key, value);
  const qs = params.toString();
  return qs ? `/leads?${qs}` : "/leads";
}

/** Toggles a single source id in/out of the comma-joined "sources" param, keeping status/view untouched. */
function buildSourceToggleHref(current: Record<string, string | undefined>, sourceId: string, activeIds: Set<string>) {
  const next = new Set(activeIds);
  if (next.has(sourceId)) next.delete(sourceId);
  else next.add(sourceId);
  return buildHref(current, "sources", next.size > 0 ? Array.from(next).join(",") : undefined);
}

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

export function LeadFilterBar({
  status,
  view,
  sources,
  leadSources,
}: {
  status?: string;
  view?: string;
  /** Raw comma-joined source ids from the URL. */
  sources?: string;
  leadSources: LeadSource[];
}) {
  const current = { status, view, sources };
  const isGrid = view === "grid";
  const activeSourceIds = new Set((sources ?? "").split(",").filter(Boolean));

  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2 overflow-x-auto">
          <FilterPill href={buildHref(current, "status", undefined)} active={!status}>
            All
          </FilterPill>
          {LEAD_STATUS_ORDER.map((s) => (
            <FilterPill key={s} href={buildHref(current, "status", s)} active={status === s}>
              {LEAD_STATUS_LABELS[s]}
            </FilterPill>
          ))}
        </div>
        <ViewToggle
          isGrid={isGrid}
          listHref={buildHref(current, "view", undefined)}
          gridHref={buildHref(current, "view", "grid")}
        />
      </div>

      {leadSources.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-navy-400">
            <Tag size={13} /> Source
          </span>
          <div className="flex flex-wrap gap-2 overflow-x-auto">
            <FilterPill href={buildHref(current, "sources", undefined)} active={activeSourceIds.size === 0}>
              All
            </FilterPill>
            {leadSources.map((source) => (
              <FilterPill
                key={source.id}
                href={buildSourceToggleHref(current, source.id, activeSourceIds)}
                active={activeSourceIds.has(source.id)}
              >
                {source.name}
              </FilterPill>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
