"use client";

import { useState } from "react";
import { CostEntryTable } from "@/components/tracker/CostEntryTable";
import { LogTimeDrawer } from "@/components/tracker/LogTimeEntryButton";
import type { CostEntry, TeamMember, WorkCategory } from "@/lib/types";

interface OwnerOption {
  id: string;
  companyName: string;
}

interface LockedTeamMember {
  id: string;
  name: string;
}

/** Wraps CostEntryTable with an edit action that reopens LogTimeDrawer pre-filled for the clicked entry. */
export function CostEntryLog({
  entries,
  clients,
  leads,
  teamMembers,
  workCategories,
  lockedTeamMember,
  ownerHourlyRate,
  showOwner = false,
  hideFinancials = false,
}: {
  entries: CostEntry[];
  clients: OwnerOption[];
  leads: OwnerOption[];
  teamMembers: TeamMember[];
  workCategories: WorkCategory[];
  lockedTeamMember?: LockedTeamMember;
  /** Owner-session only — prefills the rate field when they pick the "Me" option while editing. */
  ownerHourlyRate?: string;
  showOwner?: boolean;
  hideFinancials?: boolean;
}) {
  const [editingEntry, setEditingEntry] = useState<CostEntry | null>(null);

  return (
    <>
      <CostEntryTable
        entries={entries}
        showOwner={showOwner}
        deletable
        hideFinancials={hideFinancials}
        onEdit={setEditingEntry}
      />
      {editingEntry && (
        <LogTimeDrawer
          clients={clients}
          leads={leads}
          teamMembers={teamMembers}
          workCategories={workCategories}
          lockedTeamMember={lockedTeamMember}
          ownerHourlyRate={ownerHourlyRate}
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </>
  );
}
