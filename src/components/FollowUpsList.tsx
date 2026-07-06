"use client";

import { useRef, useTransition } from "react";
import { Trash2, Plus, CalendarClock } from "lucide-react";
import { Input, Label, FieldGroup } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { formatDate, isOverdue } from "@/lib/format";
import type { FollowUp } from "@/lib/types";
import { addFollowUp, deleteFollowUp, setFollowUpStatus } from "@/lib/actions/followups";

type Owner = { clientId: string } | { leadId: string };

function FollowUpRow({ followUp, owner, today }: { followUp: FollowUp; owner: Owner; today: string }) {
  const [, startTransition] = useTransition();
  const overdue = followUp.status === "UPCOMING" && isOverdue(followUp.date, today);
  const completed = followUp.status === "COMPLETED";

  return (
    <li className="group flex items-center justify-between gap-3 rounded-lg px-2 py-2 -mx-2 hover:bg-cream-100/60">
      <div className="min-w-0 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() =>
            startTransition(async () => {
              await setFollowUpStatus(followUp.id, completed ? "UPCOMING" : "COMPLETED", owner);
            })
          }
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors cursor-pointer",
            completed ? "bg-sage-600 border-sage-600 text-white" : "border-navy-300 hover:border-navy-500"
          )}
          aria-label={completed ? "Mark as upcoming" : "Mark as completed"}
        >
          {completed && (
            <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
              <path d="M2 6l2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <div className="min-w-0">
          <p className={cn("text-sm", completed ? "text-navy-400 line-through" : "text-navy-800 font-medium")}>
            {followUp.label}
          </p>
          <span className={cn("inline-flex items-center gap-1 text-xs", overdue ? "text-brick-600 font-medium" : "text-navy-400")}>
            <CalendarClock size={12} />
            {overdue ? "Overdue: " : ""}
            {formatDate(followUp.date)}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => startTransition(async () => deleteFollowUp(followUp.id, owner))}
        className="opacity-0 group-hover:opacity-100 text-navy-300 hover:text-brick-600 transition-opacity cursor-pointer shrink-0"
        aria-label="Delete follow-up"
      >
        <Trash2 size={14} />
      </button>
    </li>
  );
}

export function FollowUpsList({
  owner,
  followUps,
  today,
}: {
  owner: Owner;
  followUps: FollowUp[];
  today: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();
  const upcoming = followUps.filter((f) => f.status === "UPCOMING");
  const completed = followUps.filter((f) => f.status === "COMPLETED");

  return (
    <div>
      {followUps.length === 0 ? (
        <p className="text-sm text-navy-400 mb-3">No follow-ups yet.</p>
      ) : (
        <ul className="space-y-0.5 mb-3">
          {upcoming.map((f) => (
            <FollowUpRow key={f.id} followUp={f} owner={owner} today={today} />
          ))}
          {completed.map((f) => (
            <FollowUpRow key={f.id} followUp={f} owner={owner} today={today} />
          ))}
        </ul>
      )}
      <form
        ref={formRef}
        action={(formData) => {
          startTransition(async () => {
            await addFollowUp(owner, formData);
          });
          formRef.current?.reset();
        }}
        className="flex items-end gap-2"
      >
        <FieldGroup className="flex-1">
          <Label htmlFor="followup-label">Follow-up</Label>
          <Input id="followup-label" name="label" placeholder="Send updated proposal…" required />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="followup-date">Date</Label>
          <Input id="followup-date" name="date" type="date" required className="w-40" />
        </FieldGroup>
        <button
          type="submit"
          className="flex items-center justify-center rounded-lg bg-navy-100 p-2.5 text-navy-600 hover:bg-navy-200 transition-colors cursor-pointer shrink-0"
          aria-label="Add follow-up"
        >
          <Plus size={16} />
        </button>
      </form>
    </div>
  );
}
