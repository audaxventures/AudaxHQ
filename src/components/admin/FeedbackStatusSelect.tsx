"use client";

import { useTransition } from "react";
import { Select } from "@/components/ui/Field";
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
    <Select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as FeedbackStatus;
        startTransition(() => {
          void updateFeedbackStatus(feedbackId, next);
        });
      }}
      className="w-32 text-xs"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  );
}
