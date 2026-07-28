"use client";

import { usePathname, useRouter } from "next/navigation";
import { Target, Tag, UserCheck } from "lucide-react";
import { Label, Select, FieldGroup } from "@/components/ui/Field";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER, type LeadSource, type TeamMember } from "@/lib/types";

/** Sentinel for the Lead Owner dropdown's "no owner set" option — safe alongside real uuids, which never equal this literal string. */
const UNASSIGNED_OWNER_TOKEN = "unassigned";

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
  sources?: string;
  leadSources: LeadSource[];
  owners?: string;
  teamMembers: TeamMember[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isGrid = view === "grid";
  const current: Record<string, string | undefined> = { status, view, sources, owners };

  function update(key: string, value: string) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(current)) {
      if (v && k !== key) params.set(k, v);
    }
    if (value) params.set(key, value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function buildViewHref(value: string | undefined) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(current)) {
      if (v && k !== "view") params.set(k, v);
    }
    if (value) params.set("view", value);
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="min-w-[180px] flex-1">
        <FieldGroup>
          <Label htmlFor="filter-status">Pipeline Status</Label>
          <Select id="filter-status" value={status ?? ""} onChange={(e) => update("status", e.target.value)} icon={Target}>
            <option value="">All statuses</option>
            {/* Lost leads are excluded from the main list by default (see listLeads) — accessible only via the Lost drawer. */}
            {LEAD_STATUS_ORDER.filter((s) => s !== "LOST").map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </FieldGroup>
      </div>

      {leadSources.length > 0 && (
        <div className="min-w-[180px] flex-1">
          <FieldGroup>
            <Label htmlFor="filter-source">Lead Source</Label>
            <Select
              id="filter-source"
              value={sources ?? ""}
              onChange={(e) => update("sources", e.target.value)}
              icon={Tag}
            >
              <option value="">All sources</option>
              {leadSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </Select>
          </FieldGroup>
        </div>
      )}

      {teamMembers.length > 0 && (
        <div className="min-w-[180px] flex-1">
          <FieldGroup>
            <Label htmlFor="filter-owner">Lead Owner</Label>
            <Select
              id="filter-owner"
              value={owners ?? ""}
              onChange={(e) => update("owners", e.target.value)}
              icon={UserCheck}
            >
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

      <ViewToggle
        isGrid={isGrid}
        listHref={buildViewHref(undefined)}
        gridHref={buildViewHref("grid")}
        storageKey="leads-view"
      />
    </div>
  );
}
