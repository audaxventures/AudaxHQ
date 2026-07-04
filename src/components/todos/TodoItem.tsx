"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2, X, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge, TaskTypeBadge } from "@/components/ui/Badge";
import { Input, Textarea, Select, Label, FieldGroup } from "@/components/ui/Field";
import { formatDate, isOverdue } from "@/lib/format";
import type { Task, TaskStatus } from "@/lib/types";
import { TASK_STATUS_LABELS, TASK_STATUS_ORDER } from "@/lib/types";
import { deleteTask, setTaskStatus, updateTask } from "@/lib/actions/tasks";

const STATUS_SELECT_TONE: Record<TaskStatus, string> = {
  TO_BE_DONE: "border-burnt-200! bg-burnt-100! text-burnt-600!",
  IN_PROGRESS: "border-blue-600/20! bg-blue-100! text-blue-600!",
  AWAITING_CLIENT_FEEDBACK: "border-gold-600/20! bg-gold-100! text-gold-600!",
  COMPLETED: "border-sage-600/20! bg-sage-100! text-sage-600!",
};

export function TodoItem({ task, allTags }: { task: Task; allTags: string[] }) {
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();

  const overdue = task.status !== "COMPLETED" && isOverdue(task.dueDate);
  const ownerHref = task.clientId ? `/clients/${task.clientId}` : task.leadId ? `/leads/${task.leadId}` : null;
  const ownerName = task.clientName ?? task.leadName;

  if (editing) {
    return (
      <li className="rounded-xl border border-navy-200 bg-cream-100/40 p-4">
        <form
          action={(formData) => {
            startTransition(async () => {
              await updateTask(task.id, task.clientId, task.leadId, formData);
            });
            setEditing(false);
          }}
          className="space-y-3"
        >
          <input type="hidden" name="type" value={task.type} />
          <FieldGroup>
            <Label htmlFor={`title-${task.id}`}>Title</Label>
            <Input id={`title-${task.id}`} name="title" defaultValue={task.title} required />
          </FieldGroup>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldGroup>
              <Label htmlFor={`tags-${task.id}`}>Tags</Label>
              <Input
                id={`tags-${task.id}`}
                name="tags"
                defaultValue={task.tags.join(", ")}
                list="all-tags"
              />
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor={`due-${task.id}`}>Due date</Label>
              <Input
                id={`due-${task.id}`}
                name="dueDate"
                type="date"
                defaultValue={task.dueDate ? task.dueDate.slice(0, 10) : ""}
              />
            </FieldGroup>
          </div>
          <FieldGroup>
            <Label htmlFor={`desc-${task.id}`}>Notes</Label>
            <Textarea id={`desc-${task.id}`} name="description" rows={2} defaultValue={task.description ?? ""} />
          </FieldGroup>
          <datalist id="all-tags">
            {allTags.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex items-center gap-1 rounded-lg bg-navy-900 px-3 py-1.5 text-sm font-medium text-cream-50 hover:bg-navy-800 cursor-pointer"
            >
              <Check size={14} /> Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex items-center gap-1 rounded-lg border border-navy-200 px-3 py-1.5 text-sm font-medium text-navy-600 hover:bg-navy-100 cursor-pointer"
            >
              <X size={14} /> Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="group flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-cream-100/60 transition-colors">
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", task.status === "COMPLETED" ? "text-navy-400 line-through" : "text-navy-900")}>
          {task.title}
        </p>
        {task.description && (
          <p className="mt-0.5 text-sm text-navy-500 whitespace-pre-wrap">{task.description}</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <TaskTypeBadge type={task.type} />
          {ownerHref && ownerName && (
            <Link href={ownerHref} className="text-xs font-medium text-burnt-600 hover:underline underline-offset-2">
              {ownerName}
            </Link>
          )}
          {task.dueDate && (
            <Badge tone={overdue ? "brick" : "slate"}>{overdue ? "Overdue " : ""}{formatDate(task.dueDate)}</Badge>
          )}
          {task.tags.map((tag) => (
            <Badge key={tag} tone="burnt">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Select
          value={task.status}
          onChange={(e) =>
            startTransition(async () => {
              await setTaskStatus(task.id, task.clientId, task.leadId, e.target.value as TaskStatus);
            })
          }
          className={cn("w-auto text-xs font-semibold py-1 px-2", STATUS_SELECT_TONE[task.status])}
          aria-label="Task status"
        >
          {TASK_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {TASK_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="p-1.5 text-navy-300 hover:text-navy-600 cursor-pointer"
            aria-label="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => startTransition(async () => deleteTask(task.id, task.clientId, task.leadId))}
            className="p-1.5 text-navy-300 hover:text-brick-600 cursor-pointer"
            aria-label="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </li>
  );
}
