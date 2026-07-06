"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Check, Flag, Hourglass } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge, TaskTypeBadge } from "@/components/ui/Badge";
import { formatDate, formatDateInput, isOverdue } from "@/lib/format";
import { TASK_PRIORITY_LABELS } from "@/lib/types";
import type { Task, TaskPriority } from "@/lib/types";
import { setTaskStatus } from "@/lib/actions/tasks";

const PRIORITY_TONE_CLASSES: Record<TaskPriority, string> = {
  HIGH: "text-brick-600",
  MEDIUM: "text-gold-600",
  LOW: "text-navy-400",
};

function isDueToday(dueDate: string | null, today: string): boolean {
  if (!dueDate) return false;
  return formatDateInput(dueDate) === today;
}

export function TaskCard({
  task,
  onOpen,
  draggable,
  onDragStart,
  today,
}: {
  task: Task;
  onOpen: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  today: string;
}) {
  const [, startTransition] = useTransition();
  const completed = task.status === "COMPLETED";
  const overdue = !completed && isOverdue(task.dueDate, today);
  const dueToday = !completed && isDueToday(task.dueDate, today);
  const ownerHref = task.clientId ? `/clients/${task.clientId}` : task.leadId ? `/leads/${task.leadId}` : null;
  const ownerName = task.clientName ?? task.leadName;

  function toggleComplete(e: React.MouseEvent) {
    e.stopPropagation();
    const nextStatus = completed ? "TO_BE_DONE" : "COMPLETED";
    startTransition(async () => {
      await setTaskStatus(task.id, task.clientId, task.leadId, nextStatus);
    });
  }

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onOpen}
      className={cn(
        "cursor-pointer rounded-xl border border-navy-100 bg-white p-3.5 shadow-[0_1px_2px_rgba(16,29,51,0.04)] transition-shadow hover:shadow-md",
        draggable && "active:cursor-grabbing"
      )}
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={toggleComplete}
          aria-label={completed ? "Mark incomplete" : "Mark complete"}
          className={cn(
            "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors cursor-pointer",
            completed ? "border-sage-600 bg-sage-600 text-white" : "border-navy-300 hover:border-navy-500"
          )}
        >
          {completed && <Check size={12} strokeWidth={3} />}
        </button>
        <p className={cn("min-w-0 flex-1 text-sm font-medium", completed ? "text-navy-400 line-through" : "text-navy-900")}>
          {task.title}
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-7">
        <TaskTypeBadge type={task.type} todoTypeName={task.todoTypeName} />
        {ownerHref && ownerName && (
          <Link
            href={ownerHref}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center rounded-full bg-burnt-100 px-2.5 py-1 text-xs font-medium text-burnt-600 hover:bg-burnt-200"
          >
            {ownerName}
          </Link>
        )}
        {task.status === "AWAITING_CLIENT_FEEDBACK" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2.5 py-1 text-xs font-medium text-gold-600">
            <Hourglass size={11} /> Waiting on client
          </span>
        )}
        {task.tags.map((tag) => (
          <Badge key={tag} tone="slate">
            {tag}
          </Badge>
        ))}
      </div>

      <div className="mt-2.5 flex items-center justify-between pl-7 text-xs">
        <span className={cn(overdue || dueToday ? "font-semibold text-brick-600" : "text-navy-400")}>
          {completed
            ? `Completed ${formatDate(task.updatedAt)}`
            : task.dueDate
              ? `${dueToday ? "Due today" : overdue ? "Overdue " : "Due "}${dueToday ? "" : formatDate(task.dueDate)}`
              : ""}
        </span>
        {!completed && (
          <span className={cn("flex items-center gap-1 font-medium", PRIORITY_TONE_CLASSES[task.priority])}>
            <Flag size={12} />
            {TASK_PRIORITY_LABELS[task.priority]}
          </span>
        )}
      </div>
    </div>
  );
}
