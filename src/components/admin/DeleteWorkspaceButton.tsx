"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { deleteWorkspacePermanently } from "@/app/(app)/admin/actions";

export function DeleteWorkspaceButton({ businessId, workspaceName }: { businessId: string; workspaceName: string }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const matches = confirmText === workspaceName;

  function close() {
    setOpen(false);
    setConfirmText("");
    setError(null);
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteWorkspacePermanently(businessId, confirmText);
        close();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete workspace.");
      }
    });
  }

  return (
    <>
      <Button variant="danger" size="sm" type="button" className="w-full" onClick={() => setOpen(true)}>
        Delete permanently
      </Button>
      {open && (
        <Modal onClose={close} title="Permanently delete workspace">
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-navy-600">
              This permanently erases <span className="font-semibold text-navy-900">{workspaceName}</span> — every
              client, lead, invoice, to-do, and uploaded file. There is no way to undo this.
            </p>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-700">
                Type <span className="font-semibold text-navy-900">{workspaceName}</span> to confirm
              </label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={workspaceName}
                autoComplete="off"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-brick-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" type="button" onClick={close}>
                Cancel
              </Button>
              <Button variant="danger" type="button" disabled={!matches || pending} onClick={handleDelete}>
                {pending ? "Deleting…" : "Delete permanently"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
