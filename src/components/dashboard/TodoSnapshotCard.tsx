"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Flag, ListChecks } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PanelHeading } from "@/components/ui/PanelHeading";
import { cn } from "@/lib/cn";
import { formatDate, isOverdue } from "@/lib/format";
import { TASK_PRIORITY_LABELS } from "@/lib/types";
import type { Task, TaskPriority } from "@/lib/types";
import { setTaskStatus } from "@/lib/actions/tasks";

const PRIORITY_TONE_CLASSES: Record<TaskPriority, string> = {
  HIGH: "text-brick-600",
  MEDIUM: "text-gold-600",
  LOW: "text-navy-400",
};

const MAX_VISIBLE = 5;

type SnapshotView = "priority" | "overdue";

export function TodoSnapshotCard({
  tasks,
  today,
  overdueTodoCount,
}: {
  /** Up to 8 open to-dos, already sorted overdue-first, then by priority, then by due date — see getDashboardData. */
  tasks: Task[];
  today: string;
  /** Total open to-dos past due — may exceed what's in `tasks`, so the footer count/link uses this rather than counting the fetched rows. */
  overdueTodoCount: number;
}) {
  const [view, setView] = useState<SnapshotView>("priority");
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  function toggleComplete(task: Task) {
    setCheckedIds((prev) => new Set(prev).add(task.id));
    startTransition(async () => {
      await setTaskStatus(task.id, task.clientId, task.leadId, "COMPLETED", task.partnerId);
    });
    // Briefly show the checked state before the row disappears, rather than
    // yanking it out instantly — matches the completion feedback on the
    // To-Dos board's own checkbox (TaskCard.tsx).
    setTimeout(() => {
      setRemovedIds((prev) => new Set(prev).add(task.id));
    }, 400);
  }

  const remaining = tasks.filter((t) => !removedIds.has(t.id));
  const shown = (view === "overdue" ? remaining.filter((t) => isOverdue(t.dueDate, today)) : remaining).slice(
    0,
    MAX_VISIBLE
  );

  return (
    <Card tone="gold" className="p-5">
      <PanelHeading
        icon={ListChecks}
        tone="gold"
        title="Today's To-Do Priorities"
        action={
          <Link href="/todos" className="text-xs font-medium text-burnt-600 hover:underline">
            View all
          </Link>
        }
      />
      {overdueTodoCount > 0 && (
        <div className="mb-3 flex w-fit items-center gap-1 rounded-full bg-cream-100 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setView("priority")}
            className={cn(
              "rounded-full px-2.5 py-1 font-medium transition-colors cursor-pointer",
              view === "priority" ? "bg-white text-navy-900 shadow-sm" : "text-navy-500 hover:text-navy-700"
            )}
          >
            Priority
          </button>
          <button
            type="button"
            onClick={() => setView("overdue")}
            className={cn(
              "rounded-full px-2.5 py-1 font-medium transition-colors cursor-pointer",
              view === "overdue" ? "bg-white text-brick-600 shadow-sm" : "text-navy-500 hover:text-navy-700"
            )}
          >
            Overdue
          </button>
        </div>
      )}
      {shown.length === 0 ? (
        <p className="text-sm text-navy-400 py-2">
          {view === "overdue" ? "No overdue to-dos." : "No open to-dos. You're caught up."}
        </p>
      ) : (
        <ul className="divide-y divide-navy-100 -mx-1">
          {shown.map((task) => {
            const checked = checkedIds.has(task.id);
            const overdue = isOverdue(task.dueDate, today);
            return (
              <li key={task.id} className="flex items-center gap-2.5 px-1 py-2.5">
                <button
                  type="button"
                  onClick={() => !checked && toggleComplete(task)}
                  aria-label="Mark complete"
                  className={cn(
                    "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors cursor-pointer",
                    checked ? "border-sage-600 bg-sage-600 text-white" : "border-navy-300 hover:border-sage-600"
                  )}
                >
                  {checked && <Check size={12} strokeWidth={3} />}
                </button>
                <p
                  className={cn(
                    "text-sm font-medium truncate flex-1 min-w-0",
                    checked ? "text-navy-400 line-through" : "text-navy-900"
                  )}
                >
                  {task.title}
                </p>
                {task.dueDate && (
                  <span className={cn("text-xs font-medium shrink-0", overdue ? "text-brick-600" : "text-navy-500")}>
                    {formatDate(task.dueDate)}
                  </span>
                )}
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs font-medium shrink-0",
                    PRIORITY_TONE_CLASSES[task.priority]
                  )}
                >
                  <Flag size={11} />
                  {TASK_PRIORITY_LABELS[task.priority]}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {overdueTodoCount > 0 && (
        <Link
          href="/todos?due=overdue"
          className="mt-2 flex items-center gap-1.5 px-1 text-xs font-medium text-brick-600 hover:underline"
        >
          <AlertTriangle size={12} />
          {overdueTodoCount} overdue
        </Link>
      )}
    </Card>
  );
}
