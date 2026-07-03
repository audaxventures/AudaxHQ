"use client";

import { useRef, useTransition } from "react";
import { Trash2, Plus } from "lucide-react";
import { Input, Select } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { formatDate, isOverdue } from "@/lib/format";
import type { Task, TaskStatus } from "@/lib/types";
import { TASK_STATUS_LABELS, TASK_STATUS_ORDER } from "@/lib/types";
import { createScopedTask, deleteTask, setTaskStatus } from "@/lib/actions/tasks";

type Owner = { type: "CLIENT"; clientId: string } | { type: "LEAD"; leadId: string };

function ownerIds(owner: Owner) {
  return owner.type === "CLIENT"
    ? { clientId: owner.clientId, leadId: null }
    : { clientId: null, leadId: owner.leadId };
}

function TaskRow({ task, owner }: { task: Task; owner: Owner }) {
  const [, startTransition] = useTransition();
  const { clientId, leadId } = ownerIds(owner);
  const overdue = task.status !== "COMPLETED" && isOverdue(task.dueDate);

  return (
    <li className="group rounded-lg px-2 py-2 -mx-2 hover:bg-cream-100/60">
      <div className="flex items-start gap-2">
        <p
          className={cn(
            "text-sm flex-1 min-w-0 break-words",
            task.status === "COMPLETED" ? "text-navy-400 line-through" : "text-navy-800 font-medium"
          )}
        >
          {task.title}
        </p>
        <button
          type="button"
          onClick={() => startTransition(async () => deleteTask(task.id, clientId, leadId))}
          className="opacity-0 group-hover:opacity-100 text-navy-300 hover:text-brick-600 transition-opacity cursor-pointer shrink-0 mt-0.5"
          aria-label="Delete task"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className={cn("flex-1 text-xs min-w-0", overdue ? "text-brick-600 font-medium" : "text-navy-400")}>
          {task.dueDate ? `${overdue ? "Overdue: " : "Due "}${formatDate(task.dueDate)}` : ""}
        </span>
        <Select
          value={task.status}
          onChange={(e) =>
            startTransition(async () => {
              await setTaskStatus(task.id, clientId, leadId, e.target.value as TaskStatus);
            })
          }
          className="w-auto text-xs py-1 pl-2 pr-7 shrink-0"
          aria-label="Task status"
        >
          {TASK_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {TASK_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </div>
    </li>
  );
}

export function ScopedTaskList({ owner, tasks }: { owner: Owner; tasks: Task[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();

  return (
    <div>
      {tasks.length === 0 ? (
        <p className="text-sm text-navy-400 mb-2">No tasks yet.</p>
      ) : (
        <ul className="space-y-1 mb-3 divide-y divide-navy-100">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} owner={owner} />
          ))}
        </ul>
      )}
      <form
        ref={formRef}
        action={(formData) => {
          startTransition(async () => {
            await createScopedTask(owner, formData);
          });
          formRef.current?.reset();
        }}
      >
        <Input name="title" placeholder="Add a task…" required className="w-full mb-2" />
        <div className="flex items-center gap-2">
          <Input name="dueDate" type="date" className="flex-1" />
          <button
            type="submit"
            className="flex items-center justify-center rounded-lg bg-navy-100 p-1.5 text-navy-600 hover:bg-navy-200 transition-colors cursor-pointer shrink-0"
            aria-label="Add task"
          >
            <Plus size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
