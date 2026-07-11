"use client";

import { useTransition } from "react";
import { cn } from "@/lib/cn";
import { TONE_CLASSES, FEEDBACK_STATUS_TONE } from "@/components/ui/Badge";
import { updateFeedbackStatus } from "@/app/(app)/admin/actions";
import type { FeedbackStatus } from "@/lib/types";

const OPTIONS: { value: FeedbackStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "planned", label: "Planned" },
  { value: "done", label: "Done" },
];

export function FeedbackStatusSelect({ feedbackId, status }: { feedbackId: string; status: FeedbackStatus }) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as FeedbackStatus;
        startTransition(() => {
          void updateFeedbackStatus(feedbackId, next);
        });
      }}
      className={cn(
        "cursor-pointer appearance-none rounded-full border-0 px-3 py-1 text-xs font-medium tracking-wide disabled:opacity-60",
        TONE_CLASSES[FEEDBACK_STATUS_TONE[status]]
      )}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
