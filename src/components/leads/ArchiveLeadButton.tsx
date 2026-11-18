"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { setLeadArchived } from "@/app/(app)/leads/actions";

/** Shelves a lead out of the main Leads list (or brings it back) without touching its pipeline status. */
export function ArchiveLeadButton({ leadId, archived }: { leadId: string; archived: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="secondary"
        size="sm"
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await setLeadArchived(leadId, !archived);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Couldn't update this lead.");
            }
          });
        }}
      >
        {archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
        {archived ? (pending ? "Restoring…" : "Unarchive") : pending ? "Archiving…" : "Archive"}
      </Button>
      {error && <p className="text-xs text-brick-600">{error}</p>}
    </div>
  );
}
