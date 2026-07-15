"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CalendarClock, CheckCircle2, UserCircle2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { setFollowUpStatus, setFollowUpAssignee } from "@/lib/actions/followups";
import type { TeamMember } from "@/lib/types";
import type { HotFollowUp } from "@/lib/data/followups";

function ownerOf(followUp: HotFollowUp) {
  return followUp.ownerKind === "client"
    ? { href: `/clients/${followUp.clientId}`, id: { clientId: followUp.clientId! } }
    : { href: `/leads/${followUp.leadId}`, id: { leadId: followUp.leadId! } };
}

function FollowUpRow({ followUp, teamMembers }: { followUp: HotFollowUp; teamMembers: TeamMember[] }) {
  const [, startTransition] = useTransition();
  const [assignError, setAssignError] = useState<string | null>(null);
  const completed = followUp.status === "COMPLETED";
  const owner = ownerOf(followUp);

  return (
    <li className="flex items-center gap-3 rounded-xl border border-navy-100 bg-white px-3.5 py-3">
      <button
        type="button"
        onClick={() => startTransition(async () => setFollowUpStatus(followUp.id, completed ? "UPCOMING" : "COMPLETED", owner.id))}
        aria-label={completed ? "Mark as upcoming" : "Mark as completed"}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors cursor-pointer",
          completed ? "bg-sage-600 border-sage-600 text-white" : "border-navy-300 hover:border-navy-500"
        )}
      >
        {completed && (
          <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
            <path d="M2 6l2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <AvatarChip name={followUp.ownerName} className="shrink-0" />

      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", completed ? "text-navy-400 line-through" : "text-navy-900")}>
          {followUp.label}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
          <Link href={owner.href} className="text-xs text-navy-500 hover:underline">
            {followUp.ownerName}
          </Link>
          <span className={cn("inline-flex items-center gap-1 text-xs", followUp.isOverdue ? "text-brick-600 font-medium" : "text-navy-400")}>
            <CalendarClock size={12} />
            {followUp.isOverdue ? "Overdue: " : ""}
            {formatDate(followUp.date)}
          </span>
        </div>
      </div>

      {teamMembers.length > 0 && (
        <label className="inline-flex shrink-0 items-center gap-1 text-xs text-navy-400">
          <UserCircle2 size={13} />
          <select
            value={followUp.assignedToTeamMemberId ?? ""}
            onChange={(e) => {
              const nextValue = e.target.value || null;
              setAssignError(null);
              startTransition(async () => {
                try {
                  await setFollowUpAssignee(followUp.id, nextValue, owner.id);
                } catch (err) {
                  setAssignError(err instanceof Error ? err.message : "Couldn't update the assignee.");
                }
              });
            }}
            aria-label="Assign to"
            className="cursor-pointer rounded border-0 bg-transparent p-0 text-xs text-navy-500 hover:text-navy-700 focus:ring-0"
          >
            <option value="">Unassigned</option>
            {teamMembers.map((tm) => (
              <option key={tm.id} value={tm.id}>
                {tm.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {assignError && <span className="text-xs text-brick-600">{assignError}</span>}
    </li>
  );
}

export function FollowUpsWorkspace({
  followUps,
  teamMembers,
}: {
  followUps: HotFollowUp[];
  teamMembers: TeamMember[];
}) {
  const [showCompletedDrawer, setShowCompletedDrawer] = useState(false);

  const byDateAsc = (a: HotFollowUp, b: HotFollowUp) => new Date(a.date).getTime() - new Date(b.date).getTime();
  const upcoming = followUps.filter((f) => f.status === "UPCOMING" && !f.isOverdue).sort(byDateAsc);
  const overdue = followUps.filter((f) => f.status === "UPCOMING" && f.isOverdue).sort(byDateAsc);
  const completed = [...followUps]
    .filter((f) => f.status === "COMPLETED")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <Button variant="secondary" onClick={() => setShowCompletedDrawer(true)}>
          <CheckCircle2 size={16} /> Completed ({completed.length})
        </Button>
      </div>

      {overdue.length === 0 && upcoming.length === 0 ? (
        <p className="rounded-2xl border border-navy-100 bg-cream-100/40 px-4 py-8 text-center text-sm text-navy-400">
          Nothing due — you&rsquo;re all caught up.
        </p>
      ) : (
        <div className="space-y-8">
          {overdue.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-brick-600">
                Overdue
                <span className="rounded-full bg-brick-100 px-2 py-0.5 text-xs font-semibold text-brick-600">
                  {overdue.length}
                </span>
              </h2>
              <ul className="space-y-2">
                {overdue.map((f) => (
                  <FollowUpRow key={f.id} followUp={f} teamMembers={teamMembers} />
                ))}
              </ul>
            </div>
          )}
          {upcoming.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy-700">
                Upcoming
                <span className="rounded-full bg-navy-100 px-2 py-0.5 text-xs font-semibold text-navy-500">
                  {upcoming.length}
                </span>
              </h2>
              <ul className="space-y-2">
                {upcoming.map((f) => (
                  <FollowUpRow key={f.id} followUp={f} teamMembers={teamMembers} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {showCompletedDrawer && (
        <Drawer
          title="Completed follow-ups"
          description="Everything you've already followed up on."
          onClose={() => setShowCompletedDrawer(false)}
        >
          <div className="space-y-2">
            {completed.map((f) => (
              <FollowUpRow key={f.id} followUp={f} teamMembers={teamMembers} />
            ))}
            {completed.length === 0 && <p className="text-sm text-navy-400">Nothing completed yet.</p>}
          </div>
        </Drawer>
      )}
    </div>
  );
}
