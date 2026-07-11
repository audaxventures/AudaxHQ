"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteFeedback } from "@/app/(app)/admin/actions";

export function DeleteFeedbackButton({ feedbackId }: { feedbackId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label="Delete feedback"
      onClick={() => {
        if (!confirm("Delete this feedback submission? This can't be undone.")) return;
        startTransition(() => {
          void deleteFeedback(feedbackId);
        });
      }}
      className="cursor-pointer text-navy-300 transition-colors hover:text-brick-600 disabled:opacity-40"
    >
      <Trash2 size={15} />
    </button>
  );
}
