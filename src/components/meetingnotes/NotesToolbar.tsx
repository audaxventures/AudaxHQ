"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Building2, CalendarRange, Handshake, Search, Target, X } from "lucide-react";
import { Input, Select } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { DATE_RANGES, notesHref, type DateRange } from "@/components/meetingnotes/notesNav";
import { hueFor } from "@/components/meetingnotes/noteColors";

/** The client/lead/partner picker — only passed on its own tab. */
export interface OwnerPicker {
  param: "clientId" | "leadId" | "partnerId";
  label: string;
  options: { id: string; name: string }[];
}

const PICKER_ICONS = { clientId: Building2, leadId: Target, partnerId: Handshake } as const;

export function NotesToolbar({
  current,
  picker,
}: {
  current: Record<string, string | undefined>;
  picker?: OwnerPicker;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState(current.q ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedTags = (current.tag ?? "").split(",").filter(Boolean);
  const sortOldest = current.sort === "oldest";

  function go(changes: Record<string, string | undefined>) {
    router.push(notesHref(current, changes), { scroll: false });
  }

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => go({ q: value || undefined }), 350);
  }

  const pickedOwner = picker ? picker.options.find((o) => o.id === current[picker.param]) : undefined;
  const hasFilters = !!(current.q || current.range || selectedTags.length || pickedOwner);
  const clearHref = pathname + "?" + new URLSearchParams(
    Object.fromEntries(
      Object.entries({ view: current.view, folder: current.folder, sort: current.sort }).filter(([, v]) => !!v) as [string, string][]
    )
  ).toString();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[12rem] flex-1">
          <Input
            aria-label="Search notes"
            placeholder="Search notes, attendees, tags…"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            icon={Search}
            className="bg-white"
          />
        </div>
        {picker && (
          <div className="w-full sm:w-52">
            <Select
              aria-label={picker.label}
              value={current[picker.param] ?? ""}
              onChange={(e) => go({ [picker.param]: e.target.value || undefined })}
              icon={PICKER_ICONS[picker.param]}
              className="bg-white"
            >
              <option value="">All {picker.label.toLowerCase()}s</option>
              {picker.options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </div>
        )}
        <div className="w-[calc(100%-3.25rem)] sm:w-44">
          <Select
            aria-label="Date range"
            value={current.range ?? ""}
            onChange={(e) => go({ range: e.target.value || undefined })}
            icon={CalendarRange}
            className="bg-white"
          >
            <option value="">Any time</option>
            {Object.entries(DATE_RANGES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <button
          type="button"
          onClick={() => go({ sort: sortOldest ? undefined : "oldest" })}
          className="flex h-[42px] w-[42px] sm:h-[38px] sm:w-[38px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-navy-200 bg-white text-navy-600 transition-colors hover:border-navy-400"
          aria-label={sortOldest ? "Showing oldest first — switch to newest first" : "Showing newest first — switch to oldest first"}
          title={sortOldest ? "Oldest first" : "Newest first"}
        >
          {sortOldest ? <ArrowUpNarrowWide size={16} /> : <ArrowDownWideNarrow size={16} />}
        </button>
      </div>

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-1.5">
          {pickedOwner && picker && (
            <Link
              href={notesHref(current, { [picker.param]: undefined })}
              scroll={false}
              className="inline-flex items-center gap-1 rounded-full bg-navy-900 px-2.5 py-1 text-xs text-cream-50"
            >
              {pickedOwner.name} <X size={12} />
            </Link>
          )}
          {current.range && current.range in DATE_RANGES && (
            <Link
              href={notesHref(current, { range: undefined })}
              scroll={false}
              className="inline-flex items-center gap-1 rounded-full bg-navy-900 px-2.5 py-1 text-xs text-cream-50"
            >
              {DATE_RANGES[current.range as DateRange]} <X size={12} />
            </Link>
          )}
          {selectedTags.map((t) => (
            <Link
              key={t}
              href={notesHref(current, { tag: selectedTags.filter((x) => x !== t).join(",") || undefined })}
              scroll={false}
              className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", hueFor(t).chip)}
            >
              #{t} <X size={12} />
            </Link>
          ))}
          <Link
            href={clearHref.endsWith("?") ? pathname : clearHref}
            scroll={false}
            onClick={() => setSearchValue("")}
            className="ml-1 text-xs text-navy-400 underline-offset-2 hover:text-navy-700 hover:underline"
          >
            Clear all
          </Link>
        </div>
      )}
    </div>
  );
}
