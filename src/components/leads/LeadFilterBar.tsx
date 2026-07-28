import Link from "next/link";
import { Tag, UserCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER, type LeadSource, type TeamMember } from "@/lib/types";

/** Sentinel mixed into the comma-joined "owners" param to represent leads with no lead owner set — safe alongside real uuids, which never equal this literal string. */
const UNASSIGNED_OWNER_TOKEN = "unassigned";

function buildHref(current: Record<string, string | undefined>, key: string, value: string | undefined) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    if (v && k !== key) params.set(k, v);
  }
  if (value) params.set(key, value);
  const qs = params.toString();
  return qs ? `/leads?${qs}` : "/leads";
}

/** Toggles a single value in/out of a comma-joined multi-select param, keeping the rest of the filter state untouched. */
function buildMultiToggleHref(
  current: Record<string, string | undefined>,
  key: string,
  value: string,
  activeValues: Set<string>
) {
  const next = new Set(activeValues);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return buildHref(current, key, next.size > 0 ? Array.from(next).join(",") : undefined);
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
  owners,
  teamMembers,
}: {
  status?: string;
  view?: string;
  /** Raw comma-joined source ids from the URL. */
  sources?: string;
  leadSources: LeadSource[];
  /** Raw comma-joined lead-owner ids (plus the "unassigned" sentinel) from the URL. */
  owners?: string;
  teamMembers: TeamMember[];
}) {
  const current = { status, view, sources, owners };
  const isGrid = view === "grid";
  const activeSourceIds = new Set((sources ?? "").split(",").filter(Boolean));
  const activeOwnerValues = new Set((owners ?? "").split(",").filter(Boolean));

  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2 overflow-x-auto">
          <FilterPill href={buildHref(current, "status", undefined)} active={!status}>
            All
          </FilterPill>
          {/* Lost leads are excluded from the main list by default (see listLeads) — accessible only via the Lost drawer, so a status filter for them here would always come up empty. */}
          {LEAD_STATUS_ORDER.filter((s) => s !== "LOST").map((s) => (
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
                href={buildMultiToggleHref(current, "sources", source.id, activeSourceIds)}
                active={activeSourceIds.has(source.id)}
              >
                {source.name}
              </FilterPill>
            ))}
          </div>
        </div>
      )}

      {teamMembers.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-navy-400">
            <UserCheck size={13} /> Owner
          </span>
          <div className="flex flex-wrap gap-2 overflow-x-auto">
            <FilterPill href={buildHref(current, "owners", undefined)} active={activeOwnerValues.size === 0}>
              All
            </FilterPill>
            <FilterPill
              href={buildMultiToggleHref(current, "owners", UNASSIGNED_OWNER_TOKEN, activeOwnerValues)}
              active={activeOwnerValues.has(UNASSIGNED_OWNER_TOKEN)}
            >
              Unassigned
            </FilterPill>
            {teamMembers.map((member) => (
              <FilterPill
                key={member.id}
                href={buildMultiToggleHref(current, "owners", member.id, activeOwnerValues)}
                active={activeOwnerValues.has(member.id)}
              >
                {member.name}
              </FilterPill>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
