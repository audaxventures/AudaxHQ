"use client";

import { useRef, useTransition } from "react";
import { ChevronDown, Hourglass, Trash2, Plus, UserCircle2 } from "lucide-react";
import { Input, Select } from "@/components/ui/Field";
import { TONE_CLASSES, TASK_STATUS_TONE } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { formatDate, isOverdue } from "@/lib/format";
import type { Task, TaskStatus } from "@/lib/types";
import { TASK_STATUS_LABELS, TASK_STATUS_ORDER } from "@/lib/types";
import { createScopedTask, deleteTask, setTaskStatus } from "@/lib/actions/tasks";

type Owner = { type: "CLIENT"; clientId: string } | { type: "LEAD"; leadId: string } | { type: "PARTNER"; partnerId: string };
type AssignOption = { value: string; label: string };

function ownerIds(owner: Owner) {
  if (owner.type === "CLIENT") return { clientId: owner.clientId, leadId: null, partnerId: null };
  if (owner.type === "LEAD") return { clientId: null, leadId: owner.leadId, partnerId: null };
  return { clientId: null, leadId: null, partnerId: owner.partnerId };
}

function TaskRow({ task, owner, today }: { task: Task; owner: Owner; today: string }) {
  const [, startTransition] = useTransition();
  const { clientId, leadId, partnerId } = ownerIds(owner);
  const overdue = task.status !== "COMPLETED" && isOverdue(task.dueDate, today);

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
          onClick={() => startTransition(async () => deleteTask(task.id, clientId, leadId, partnerId))}
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
        <div
          className={cn(
            "relative inline-flex shrink-0 items-center gap-1 rounded-full pl-2.5 pr-6 py-1 text-xs font-medium tracking-wide",
            TONE_CLASSES[TASK_STATUS_TONE[task.status]]
          )}
        >
          <span className="pointer-events-none whitespace-nowrap">{TASK_STATUS_LABELS[task.status]}</span>
          <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-60" />
          <select
            value={task.status}
            onChange={(e) =>
              startTransition(async () => {
                await setTaskStatus(task.id, clientId, leadId, e.target.value as TaskStatus, partnerId);
              })
            }
            className="absolute inset-0 cursor-pointer appearance-none bg-transparent text-transparent focus:outline-none"
            aria-label="Task status"
          >
            {TASK_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {TASK_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </li>
  );
}

export function ScopedTaskList({
  owner,
  tasks,
  today,
  assignOptions,
}: {
  owner: Owner;
  tasks: Task[];
  today: string;
  /** Who a new task can be assigned to — "Me" plus whoever else is on the team. The field is hidden when there's nobody else to assign to (a solo business), same as FollowUpsList's add-row. */
  assignOptions: AssignOption[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();
  // Action items marked "them" on a meeting note — their commitment, not
  // ours, so they're broken out from the team's own task list below rather
  // than mixed in with it.
  const waitingTasks = tasks.filter((t) => t.ownedBy === "EXTERNAL");
  const ownTasks = tasks.filter((t) => t.ownedBy !== "EXTERNAL");

  return (
    <div>
      {waitingTasks.length > 0 && (
        <div className="mb-4">
          <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gold-600">
            <Hourglass size={12} /> Waiting on them
          </p>
          <ul className="space-y-1 mb-1 divide-y divide-navy-100">
            {waitingTasks.map((task) => (
              <TaskRow key={task.id} task={task} owner={owner} today={today} />
            ))}
          </ul>
        </div>
      )}
      {ownTasks.length === 0 ? (
        <p className="text-sm text-navy-400 mb-2">No tasks yet.</p>
      ) : (
        <ul className="space-y-1 mb-3 divide-y divide-navy-100">
          {ownTasks.map((task) => (
            <TaskRow key={task.id} task={task} owner={owner} today={today} />
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
          <Input name="dueDate" type="date" className="flex-1 min-w-0" />
          {assignOptions.length > 1 && (
            <Select name="assignedTo" defaultValue="" className="w-32 shrink-0" icon={UserCircle2} aria-label="Assign to">
              {assignOptions.map((opt) => (
                <option key={opt.value || "self"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          )}
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
