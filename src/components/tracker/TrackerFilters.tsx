"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Building2, Calendar, DollarSign, List, Search, Target, User } from "lucide-react";
import { Input, Label, Select, FieldGroup } from "@/components/ui/Field";
import type { TeamMember, WorkCategory } from "@/lib/types";

interface OwnerOption {
  id: string;
  companyName: string;
}

export function TrackerFilters({
  clients,
  leads,
  teamMembers,
  workCategories,
  filters,
  hideTeamMemberFilter = false,
}: {
  clients: OwnerOption[];
  leads: OwnerOption[];
  teamMembers: TeamMember[];
  workCategories: WorkCategory[];
  filters: Record<string, string | undefined>;
  /** Team members only ever see their own entries, so filtering by "who" is moot for them. */
  hideTeamMemberFilter?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState(filters.q ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function update(key: string, value: string) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) {
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
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <FieldGroup>
          <Label htmlFor="filter-client">Client</Label>
          <Select
            id="filter-client"
            value={filters.clientId ?? ""}
            onChange={(e) => update("clientId", e.target.value)}
            icon={Building2}
          >
            <option value="">All clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="filter-lead">Lead</Label>
          <Select
            id="filter-lead"
            value={filters.leadId ?? ""}
            onChange={(e) => update("leadId", e.target.value)}
            icon={Target}
          >
            <option value="">All leads</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.companyName}
              </option>
            ))}
          </Select>
        </FieldGroup>
        {!hideTeamMemberFilter && (
          <FieldGroup>
            <Label htmlFor="filter-team-member">Team member</Label>
            <Select
              id="filter-team-member"
              value={filters.teamMemberId ?? ""}
              onChange={(e) => update("teamMemberId", e.target.value)}
              icon={User}
            >
              <option value="">Everyone</option>
              {teamMembers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </FieldGroup>
        )}
        <FieldGroup>
          <Label htmlFor="filter-category">Category</Label>
          <Select
            id="filter-category"
            value={filters.workCategoryId ?? ""}
            onChange={(e) => update("workCategoryId", e.target.value)}
            icon={List}
          >
            <option value="">All categories</option>
            {workCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="filter-billable">Billable</Label>
          <Select
            id="filter-billable"
            value={filters.billable ?? ""}
            onChange={(e) => update("billable", e.target.value)}
            icon={DollarSign}
          >
            <option value="">All</option>
            <option value="true">Billable</option>
            <option value="false">Non-billable</option>
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="filter-from">From</Label>
          <Input
            id="filter-from"
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(e) => update("dateFrom", e.target.value)}
            icon={Calendar}
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="filter-to">To</Label>
          <Input
            id="filter-to"
            type="date"
            value={filters.dateTo ?? ""}
            onChange={(e) => update("dateTo", e.target.value)}
            icon={Calendar}
          />
        </FieldGroup>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-navy-100 pt-4">
        <div className="min-w-[240px] flex-1">
          <Input
            placeholder="Search entries…"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            icon={Search}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-navy-600">
          <input
            type="checkbox"
            checked={filters.archived === "true"}
            onChange={(e) => update("archived", e.target.checked ? "true" : "")}
            className="rounded border-navy-300"
          />
          Show archived
        </label>
      </div>
    </div>
  );
}
