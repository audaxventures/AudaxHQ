"use client";

import { useRef, useTransition } from "react";
import Link from "next/link";
import { motion, type PanInfo } from "framer-motion";
import { Check, Flag, Hourglass, NotebookPen, Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge, TaskTypeBadge } from "@/components/ui/Badge";
import { formatDate, formatDateInput, isOverdue } from "@/lib/format";
import { TASK_PRIORITY_LABELS } from "@/lib/types";
import type { Task, TaskPriority } from "@/lib/types";
import { setTaskStatus } from "@/lib/actions/tasks";
import { entityColorChipClass } from "@/lib/avatar";

const PRIORITY_TONE_CLASSES: Record<TaskPriority, string> = {
  HIGH: "text-brick-600",
  MEDIUM: "text-gold-600",
  LOW: "text-navy-400",
};

function isDueToday(dueDate: string | null, today: string): boolean {
  if (!dueDate) return false;
  return formatDateInput(dueDate) === today;
}

/** Column drop targets are marked with data-column-key — walk the elements under the pointer (skipping the dragged card itself) to find one. */
function columnKeyAtPoint(x: number, y: number, exclude: Element | null): string | null {
  for (const el of document.elementsFromPoint(x, y)) {
    if (exclude?.contains(el)) continue;
    const columnEl = el.closest?.("[data-column-key]");
    if (columnEl instanceof HTMLElement) return columnEl.dataset.columnKey ?? null;
  }
  return null;
}

export function TaskCard({
  task,
  onOpen,
  today,
  onDragColumnChange,
  onDropOnColumn,
  draggable = true,
  assignedToLabel,
}: {
  task: Task;
  onOpen: () => void;
  today: string;
  /** Fires continuously while dragging with the column key under the pointer (or null), so the board can highlight the target column. Also used on drag end/cancel to clear it. */
  onDragColumnChange?: (columnKey: string | null) => void;
  /** Fires once on drop with the column key under the pointer, if any. */
  onDropOnColumn?: (columnKey: string) => void;
  /** False for cards in "Assigned to others" — you can still open and edit them, but board-ownership drag-and-drop belongs to whoever they're assigned to. */
  draggable?: boolean;
  /** Set only for cards not on the viewer's own board — shows who this was handed off to. */
  assignedToLabel?: string;
}) {
  const [, startTransition] = useTransition();
  const cardRef = useRef<HTMLDivElement>(null);
  // framer-motion can still fire onTap for the same gesture that just completed
  // a drag (e.g. once the card's dropped into a new column and remounts there),
  // so suppress onOpen briefly after any drag ends rather than trusting tap/drag
  // to be mutually exclusive.
  const justDraggedRef = useRef(false);
  // Same story as justDraggedRef: framer-motion's onTap still fires after a
  // click on the checkbox button, which would reopen the drawer right after
  // toggling completion — suppress it briefly instead of relying solely on
  // the checkbox's own stopPropagation.
  const justToggledRef = useRef(false);
  const completed = task.status === "COMPLETED";
  const overdue = !completed && isOverdue(task.dueDate, today);
  const dueToday = !completed && isDueToday(task.dueDate, today);
  const ownerHref = task.clientId ? `/clients/${task.clientId}` : task.leadId ? `/leads/${task.leadId}` : null;
  const ownerName = task.clientName ?? task.leadName;
  const ownerColor = task.clientColor ?? task.leadColor;
  // Someone handed this off to you rather than you creating it yourself.
  const handedOff = task.createdByTeamMemberId !== task.assignedToTeamMemberId;

  function toggleComplete(e: React.MouseEvent) {
    e.stopPropagation();
    justToggledRef.current = true;
    setTimeout(() => {
      justToggledRef.current = false;
    }, 150);
    const nextStatus = completed ? "TO_BE_DONE" : "COMPLETED";
    startTransition(async () => {
      await setTaskStatus(task.id, task.clientId, task.leadId, nextStatus);
    });
  }

  function handleDrag(_: unknown, info: PanInfo) {
    onDragColumnChange?.(columnKeyAtPoint(info.point.x, info.point.y, cardRef.current));
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    justDraggedRef.current = true;
    setTimeout(() => {
      justDraggedRef.current = false;
    }, 150);
    const key = columnKeyAtPoint(info.point.x, info.point.y, cardRef.current);
    onDragColumnChange?.(null);
    if (key) onDropOnColumn?.(key);
  }

  function handleTap() {
    if (justDraggedRef.current || justToggledRef.current) return;
    onOpen();
  }

  return (
    <motion.div
      ref={cardRef}
      drag={draggable}
      dragSnapToOrigin
      dragElastic={0.15}
      dragMomentum={false}
      onDrag={draggable ? handleDrag : undefined}
      onDragEnd={draggable ? handleDragEnd : undefined}
      onTap={handleTap}
      whileDrag={draggable ? { scale: 1.04, boxShadow: "0 16px 32px rgba(16,29,51,0.2)", zIndex: 50 } : undefined}
      style={{ touchAction: draggable ? "none" : undefined }}
      className={cn(
        "rounded-xl border border-navy-100 bg-white p-3.5 shadow-[0_1px_2px_rgba(16,29,51,0.04)] transition-shadow hover:shadow-md",
        draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      )}
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
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
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium opacity-90 hover:opacity-100",
              entityColorChipClass(ownerColor, ownerName)
            )}
          >
            {ownerName}
          </Link>
        )}
        {task.meetingNoteId && (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-600">
            <NotebookPen size={11} /> From meeting
          </span>
        )}
        {task.status === "AWAITING_CLIENT_FEEDBACK" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2.5 py-1 text-xs font-medium text-gold-600">
            <Hourglass size={11} /> Waiting on client
          </span>
        )}
        {assignedToLabel ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-600">
            <Send size={11} /> To {assignedToLabel}
          </span>
        ) : (
          handedOff && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-600">
              <Send size={11} /> From {task.createdByName}
            </span>
          )
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
    </motion.div>
  );
}
