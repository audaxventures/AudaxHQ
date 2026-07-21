"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Building2, Search, Target } from "lucide-react";
import { Input, Label, Select, FieldGroup } from "@/components/ui/Field";

interface OwnerOption {
  id: string;
  companyName: string;
}

export function MeetingNotesFilters({
  clients,
  leads,
  filters,
}: {
  clients: OwnerOption[];
  leads: OwnerOption[];
  filters: Record<string, string | undefined>;
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
    <div className="flex flex-wrap items-end gap-4">
      <div className="min-w-[200px] flex-1">
        <FieldGroup>
          <Label htmlFor="filter-client">Client</Label>
          <Select id="filter-client" value={filters.clientId ?? ""} onChange={(e) => update("clientId", e.target.value)} icon={Building2}>
            <option value="">All clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </Select>
        </FieldGroup>
      </div>
      <div className="min-w-[200px] flex-1">
        <FieldGroup>
          <Label htmlFor="filter-lead">Lead</Label>
          <Select id="filter-lead" value={filters.leadId ?? ""} onChange={(e) => update("leadId", e.target.value)} icon={Target}>
            <option value="">All leads</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.companyName}
              </option>
            ))}
          </Select>
        </FieldGroup>
      </div>
      <div className="min-w-[240px] flex-[2]">
        <FieldGroup>
          <Label htmlFor="filter-search">Search</Label>
          <Input
            id="filter-search"
            placeholder="Search title, attendees, notes…"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            icon={Search}
          />
        </FieldGroup>
      </div>
    </div>
  );
}
