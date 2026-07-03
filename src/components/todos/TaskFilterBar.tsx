import Link from "next/link";
import { cn } from "@/lib/cn";
import { TASK_STATUS_LABELS, TASK_STATUS_ORDER, TASK_TYPE_LABELS, TASK_TYPE_ORDER } from "@/lib/types";

interface CurrentFilters {
  type?: string;
  status?: string;
  tag?: string;
}

function buildHref(current: CurrentFilters, key: keyof CurrentFilters, value: string | undefined) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    if (v && k !== key) params.set(k, v);
  }
  if (value) params.set(key, value);
  const qs = params.toString();
  return qs ? `/todos?${qs}` : "/todos";
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

export function TaskFilterBar({
  type,
  status,
  tag,
  allTags,
}: {
  type?: string;
  status?: string;
  tag?: string;
  allTags: string[];
}) {
  const current = { type, status, tag };

  return (
    <div className="space-y-3 mb-6">
      <div className="flex flex-wrap gap-2 overflow-x-auto">
        <FilterPill href={buildHref(current, "type", undefined)} active={!type}>
          All types
        </FilterPill>
        {TASK_TYPE_ORDER.map((t) => (
          <FilterPill key={t} href={buildHref(current, "type", t)} active={type === t}>
            {TASK_TYPE_LABELS[t]}
          </FilterPill>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 overflow-x-auto">
        <FilterPill href={buildHref(current, "status", undefined)} active={!status}>
          All statuses
        </FilterPill>
        {TASK_STATUS_ORDER.map((s) => (
          <FilterPill key={s} href={buildHref(current, "status", s)} active={status === s}>
            {TASK_STATUS_LABELS[s]}
          </FilterPill>
        ))}
      </div>
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 overflow-x-auto">
          <FilterPill href={buildHref(current, "tag", undefined)} active={!tag}>
            All tags
          </FilterPill>
          {allTags.map((t) => (
            <FilterPill key={t} href={buildHref(current, "tag", t)} active={tag === t}>
              {t}
            </FilterPill>
          ))}
        </div>
      )}
    </div>
  );
}
