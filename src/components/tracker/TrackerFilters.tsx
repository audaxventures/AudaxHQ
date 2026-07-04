"use client";

import { usePathname, useRouter } from "next/navigation";
import { Input, Label, Select, FieldGroup } from "@/components/ui/Field";
import type { TeamMember } from "@/lib/types";

interface OwnerOption {
  id: string;
  companyName: string;
}

export function TrackerFilters({
  clients,
  leads,
  teamMembers,
  filters,
}: {
  clients: OwnerOption[];
  leads: OwnerOption[];
  teamMembers: TeamMember[];
  filters: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function update(key: string, value: string) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) {
      if (v && k !== key) params.set(k, v);
    }
    if (value) params.set(key, value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <FieldGroup>
        <Label htmlFor="filter-client">Client</Label>
        <Select id="filter-client" value={filters.clientId ?? ""} onChange={(e) => update("clientId", e.target.value)}>
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
        <Select id="filter-lead" value={filters.leadId ?? ""} onChange={(e) => update("leadId", e.target.value)}>
          <option value="">All leads</option>
          {leads.map((l) => (
            <option key={l.id} value={l.id}>
              {l.companyName}
            </option>
          ))}
        </Select>
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="filter-team-member">Team member</Label>
        <Select
          id="filter-team-member"
          value={filters.teamMemberId ?? ""}
          onChange={(e) => update("teamMemberId", e.target.value)}
        >
          <option value="">Everyone</option>
          {teamMembers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="filter-billable">Billable</Label>
        <Select id="filter-billable" value={filters.billable ?? ""} onChange={(e) => update("billable", e.target.value)}>
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
        />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="filter-to">To</Label>
        <Input id="filter-to" type="date" value={filters.dateTo ?? ""} onChange={(e) => update("dateTo", e.target.value)} />
      </FieldGroup>
    </div>
  );
}
