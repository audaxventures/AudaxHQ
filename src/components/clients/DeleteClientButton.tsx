"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { deleteClientPermanently } from "@/app/(app)/clients/actions";

export function DeleteClientButton({ clientId, companyName }: { clientId: string; companyName: string }) {
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
          if (
            !confirm(
              `Permanently delete ${companyName}? This removes all of its notes, follow-ups, invoices, and time entries. This can't be undone.`
            )
          ) {
            return;
          }
          setError(null);
          startTransition(async () => {
            try {
              await deleteClientPermanently(clientId);
              router.push("/clients");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Couldn't delete this client.");
            }
          });
        }}
      >
        <Trash2 size={15} /> {pending ? "Deleting…" : "Delete permanently"}
      </Button>
      {error && <p className="text-xs text-brick-600">{error}</p>}
    </div>
  );
}
