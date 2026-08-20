"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CircleDot, Building2, Search, UserCheck, ArrowDownAZ } from "lucide-react";
import { Input, Label, Select, FieldGroup } from "@/components/ui/Field";
import { PROSPECT_STATUS_LABELS, PROSPECT_STATUS_ORDER, type TeamMember } from "@/lib/types";

/** Sentinel for the Owner dropdown's "no owner set" option — safe alongside real uuids, which never equal this literal string. */
const UNASSIGNED_OWNER_TOKEN = "unassigned";

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Next follow-up" },
  { value: "name", label: "Name (A–Z)" },
  { value: "owner", label: "Owner" },
  { value: "industry", label: "Industry" },
  { value: "created", label: "Newest" },
];

export function ProspectFilterBar({
  status,
  industry,
  industries,
  owners,
  teamMembers,
  sort,
  q,
}: {
  status?: string;
  industry?: string;
  industries: string[];
  owners?: string;
  teamMembers: TeamMember[];
  sort?: string;
  q?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const current: Record<string, string | undefined> = { status, industry, owners, sort, q };
  const [searchValue, setSearchValue] = useState(q ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function update(key: string, value: string) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(current)) {
      if (v && k !== key) params.set(k, v);
    }
    if (value) params.set(key, value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => update("q", value), 400);
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="min-w-[220px] flex-[1.5]">
        <FieldGroup>
          <Label htmlFor="filter-search">Search</Label>
          <Input
            id="filter-search"
            placeholder="Business or contact name…"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            icon={Search}
          />
        </FieldGroup>
      </div>
      <div className="min-w-[180px] flex-1">
        <FieldGroup>
          <Label htmlFor="filter-status">Status</Label>
          <Select id="filter-status" value={status ?? ""} onChange={(e) => update("status", e.target.value)} icon={CircleDot}>
            <option value="">All statuses</option>
            {PROSPECT_STATUS_ORDER.filter((s) => s !== "CONVERTED").map((s) => (
              <option key={s} value={s}>
                {PROSPECT_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </FieldGroup>
      </div>

      {industries.length > 0 && (
        <div className="min-w-[180px] flex-1">
          <FieldGroup>
            <Label htmlFor="filter-industry">Industry</Label>
            <Select id="filter-industry" value={industry ?? ""} onChange={(e) => update("industry", e.target.value)} icon={Building2}>
              <option value="">All industries</option>
              {industries.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </Select>
          </FieldGroup>
        </div>
      )}

      {teamMembers.length > 0 && (
        <div className="min-w-[180px] flex-1">
          <FieldGroup>
            <Label htmlFor="filter-owner">Owner</Label>
            <Select id="filter-owner" value={owners ?? ""} onChange={(e) => update("owners", e.target.value)} icon={UserCheck}>
              <option value="">All owners</option>
              <option value={UNASSIGNED_OWNER_TOKEN}>Unassigned</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </FieldGroup>
        </div>
      )}

      <div className="min-w-[180px] flex-1">
        <FieldGroup>
          <Label htmlFor="filter-sort">Sort by</Label>
          <Select id="filter-sort" value={sort ?? ""} onChange={(e) => update("sort", e.target.value)} icon={ArrowDownAZ}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value || "default"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </FieldGroup>
      </div>
    </div>
  );
}
