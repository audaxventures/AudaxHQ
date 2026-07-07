"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpDown, Calendar, ChevronDown, Flag, List, Search, SlidersHorizontal, Tag as TagIcon } from "lucide-react";
import { Input, Label, Select, FieldGroup } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { TASK_PRIORITY_LABELS, TASK_PRIORITY_ORDER, TASK_STATUS_LABELS, TASK_STATUS_ORDER } from "@/lib/types";
import type { TodoType } from "@/lib/types";

interface Filters {
  q?: string;
  type?: string;
  todoTypeId?: string;
  status?: string;
  tag?: string;
  priority?: string;
  due?: string;
  sort?: string;
}

const DUE_OPTIONS = [
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Due today" },
  { value: "week", label: "Due this week" },
  { value: "none", label: "No due date" },
];

const SORT_OPTIONS = [
  { value: "due", label: "Due date (soonest)" },
  { value: "priority", label: "Priority (high to low)" },
  { value: "created", label: "Recently created" },
];

export function TaskFilterBar({
  filters,
  allTags,
  todoTypes,
}: {
  filters: Filters;
  allTags: string[];
  todoTypes: TodoType[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState(filters.q ?? "");
  const [expanded, setExpanded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeTodoTypes = todoTypes.filter((t) => t.active);
  const hasActiveFilters = Object.values(filters).some(Boolean);

  function update(updates: Partial<Filters>) {
    const params = new URLSearchParams();
    const merged = { ...filters, ...updates };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => update({ q: value }), 400);
  }

  function handleTypeChange(value: string) {
    if (value === "CLIENT" || value === "LEAD" || value === "") {
      update({ type: value || undefined, todoTypeId: undefined });
    } else {
      update({ type: undefined, todoTypeId: value });
    }
  }

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="mb-3 flex w-full items-center justify-between rounded-xl border border-navy-200 bg-white px-4 py-2.5 text-sm font-medium text-navy-700"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal size={15} />
          Filters &amp; search
          {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-burnt-500" />}
        </span>
        <ChevronDown size={16} className={cn("transition-transform", expanded && "rotate-180")} />
      </button>
      <div className={cn(!expanded && "hidden")}>
        <div className="mb-3">
          <Input
            placeholder="Search tasks…"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            icon={Search}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <FieldGroup>
            <Label htmlFor="filter-type">Type</Label>
            <Select
              id="filter-type"
              value={filters.todoTypeId || filters.type || ""}
              onChange={(e) => handleTypeChange(e.target.value)}
              icon={List}
            >
              <option value="">All types</option>
              <option value="CLIENT">Client</option>
              <option value="LEAD">Lead</option>
              {activeTodoTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="filter-status">Status</Label>
            <Select
              id="filter-status"
              value={filters.status ?? ""}
              onChange={(e) => update({ status: e.target.value || undefined })}
              icon={List}
            >
              <option value="">All statuses</option>
              {TASK_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {TASK_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="filter-tag">Tags</Label>
            <Select
              id="filter-tag"
              value={filters.tag ?? ""}
              onChange={(e) => update({ tag: e.target.value || undefined })}
              icon={TagIcon}
            >
              <option value="">All tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="filter-due">Due date</Label>
            <Select
              id="filter-due"
              value={filters.due ?? ""}
              onChange={(e) => update({ due: e.target.value || undefined })}
              icon={Calendar}
            >
              <option value="">All</option>
              {DUE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="filter-priority">Priority</Label>
            <Select
              id="filter-priority"
              value={filters.priority ?? ""}
              onChange={(e) => update({ priority: e.target.value || undefined })}
              icon={Flag}
            >
              <option value="">All</option>
              {TASK_PRIORITY_ORDER.map((p) => (
                <option key={p} value={p}>
                  {TASK_PRIORITY_LABELS[p]}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="filter-sort">Sort</Label>
            <Select
              id="filter-sort"
              value={filters.sort ?? "due"}
              onChange={(e) => update({ sort: e.target.value === "due" ? undefined : e.target.value })}
              icon={ArrowUpDown}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </FieldGroup>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => router.push(pathname)}
            className="mt-3 text-sm font-medium text-navy-400 hover:text-navy-700 cursor-pointer"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
