"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { deleteLead } from "@/app/(app)/leads/actions";

export function DeleteLeadButton({ leadId, companyName }: { leadId: string; companyName: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="danger"
        size="sm"
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Delete ${companyName}? This can't be undone.`)) return;
          setError(null);
          startTransition(async () => {
            try {
              await deleteLead(leadId);
              router.push("/leads");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Couldn't delete this lead.");
            }
          });
        }}
      >
        <Trash2 size={15} /> {pending ? "Deleting…" : "Delete"}
      </Button>
      {error && <p className="text-xs text-brick-600">{error}</p>}
    </div>
  );
}
