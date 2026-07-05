import Link from "next/link";
import { cn } from "@/lib/cn";
import { TASK_STATUS_LABELS, TASK_STATUS_ORDER } from "@/lib/types";
import type { TodoType } from "@/lib/types";

interface CurrentFilters {
  type?: string;
  todoTypeId?: string;
  status?: string;
  tag?: string;
}

function buildHref(current: CurrentFilters, updates: Partial<CurrentFilters>) {
  const merged = { ...current, ...updates };
  const params = new URLSearchParams();
  if (merged.type) params.set("type", merged.type);
  if (merged.todoTypeId) params.set("todoTypeId", merged.todoTypeId);
  if (merged.status) params.set("status", merged.status);
  if (merged.tag) params.set("tag", merged.tag);
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
  todoTypeId,
  status,
  tag,
  allTags,
  todoTypes,
}: {
  type?: string;
  todoTypeId?: string;
  status?: string;
  tag?: string;
  allTags: string[];
  todoTypes: TodoType[];
}) {
  const current = { type, todoTypeId, status, tag };
  const activeTodoTypes = todoTypes.filter((t) => t.active);

  return (
    <div className="space-y-3 mb-6">
      <div className="flex flex-wrap gap-2 overflow-x-auto">
        <FilterPill
          href={buildHref(current, { type: undefined, todoTypeId: undefined })}
          active={!type && !todoTypeId}
        >
          All types
        </FilterPill>
        <FilterPill
          href={buildHref(current, { type: "CLIENT", todoTypeId: undefined })}
          active={type === "CLIENT"}
        >
          Client
        </FilterPill>
        <FilterPill
          href={buildHref(current, { type: "LEAD", todoTypeId: undefined })}
          active={type === "LEAD"}
        >
          Lead
        </FilterPill>
        {activeTodoTypes.map((t) => (
          <FilterPill
            key={t.id}
            href={buildHref(current, { type: undefined, todoTypeId: t.id })}
            active={todoTypeId === t.id}
          >
            {t.name}
          </FilterPill>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 overflow-x-auto">
        <FilterPill href={buildHref(current, { status: undefined })} active={!status}>
          All statuses
        </FilterPill>
        {TASK_STATUS_ORDER.map((s) => (
          <FilterPill key={s} href={buildHref(current, { status: s })} active={status === s}>
            {TASK_STATUS_LABELS[s]}
          </FilterPill>
        ))}
      </div>
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 overflow-x-auto">
          <FilterPill href={buildHref(current, { tag: undefined })} active={!tag}>
            All tags
          </FilterPill>
          {allTags.map((t) => (
            <FilterPill key={t} href={buildHref(current, { tag: t })} active={tag === t}>
              {t}
            </FilterPill>
          ))}
        </div>
      )}
    </div>
  );
}
