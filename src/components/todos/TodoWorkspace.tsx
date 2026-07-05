"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Circle, GripVertical, Hourglass, ListTodo, Plus } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { createTask, setTaskStatus } from "@/lib/actions/tasks";
import { TASK_STATUS_LABELS } from "@/lib/types";
import type { Task, TaskStatus, TodoType } from "@/lib/types";
import { TaskCard } from "@/components/todos/TaskCard";
import { TaskFormDrawer } from "@/components/todos/TaskFormDrawer";

interface OwnerOption {
  id: string;
  companyName: string;
}

type DrawerState = { mode: "create"; defaultStatus: TaskStatus } | { mode: "edit"; task: Task } | null;

const COLUMN_CONFIG: Record<TaskStatus, { icon: LucideIcon; iconClasses: string }> = {
  TO_BE_DONE: { icon: ListTodo, iconClasses: "bg-burnt-100 text-burnt-600" },
  IN_PROGRESS: { icon: Circle, iconClasses: "bg-blue-100 text-blue-600" },
  AWAITING_CLIENT_FEEDBACK: { icon: Hourglass, iconClasses: "bg-gold-100 text-gold-600" },
  COMPLETED: { icon: CheckCircle2, iconClasses: "bg-sage-100 text-sage-600" },
};

const COMPLETED_PREVIEW_COUNT = 3;

export function TodoWorkspace({
  tasks,
  showAllCompleted,
  completedHref,
  visibleStatuses,
  clients,
  leads,
  todoTypes,
  defaultTypeSelection,
}: {
  tasks: Task[];
  showAllCompleted: boolean;
  completedHref: string;
  visibleStatuses: TaskStatus[];
  clients: OwnerOption[];
  leads: OwnerOption[];
  todoTypes: TodoType[];
  defaultTypeSelection: string;
}) {
  const [optimisticTasks, applyStatusChange] = useOptimistic(
    tasks,
    (state, update: { id: string; status: TaskStatus }) =>
      state.map((t) => (t.id === update.id ? { ...t, status: update.status } : t))
  );
  const [, startTransition] = useTransition();
  const [drawerState, setDrawerState] = useState<DrawerState>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  const quickAddRef = useRef<HTMLFormElement>(null);
  const [quickAddPending, startQuickAdd] = useTransition();

  function handleDrop(status: TaskStatus, e: React.DragEvent) {
    e.preventDefault();
    setDragOverStatus(null);
    const taskId = e.dataTransfer.getData("text/plain");
    const task = optimisticTasks.find((t) => t.id === taskId);
    if (!task || task.status === status) return;
    startTransition(async () => {
      applyStatusChange({ id: taskId, status });
      await setTaskStatus(taskId, task.clientId, task.leadId, status);
    });
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <form
          ref={quickAddRef}
          action={(formData) => {
            startQuickAdd(async () => {
              await createTask(formData);
              quickAddRef.current?.reset();
            });
          }}
          className="flex flex-1 items-center gap-2 rounded-2xl border border-navy-200 bg-white px-2 py-1.5"
        >
          <Plus size={18} className="ml-2 shrink-0 text-navy-300" />
          <input type="hidden" name="typeSelection" value={defaultTypeSelection} />
          <Input
            name="title"
            required
            placeholder="Add a new task…"
            className="flex-1 border-0 bg-transparent px-1 shadow-none focus:ring-0"
          />
          <button
            type="submit"
            disabled={quickAddPending}
            className="shrink-0 rounded-xl bg-navy-100 px-3 py-2 text-sm font-medium text-navy-700 transition-colors hover:bg-navy-200 disabled:opacity-50 cursor-pointer"
          >
            {quickAddPending ? "Adding…" : "Add"}
          </button>
        </form>
        <Button onClick={() => setDrawerState({ mode: "create", defaultStatus: "TO_BE_DONE" })}>
          <Plus size={16} /> Create
        </Button>
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-4",
          visibleStatuses.length > 1 ? "lg:grid-cols-4" : "lg:grid-cols-1"
        )}
      >
        {visibleStatuses.map((status) => {
          const items = optimisticTasks.filter((t) => t.status === status);
          const isCompleted = status === "COMPLETED";
          const visibleItems = isCompleted && !showAllCompleted ? items.slice(0, COMPLETED_PREVIEW_COUNT) : items;
          const config = COLUMN_CONFIG[status];
          const Icon = config.icon;

          return (
            <div
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStatus(status);
              }}
              onDragLeave={() => setDragOverStatus((s) => (s === status ? null : s))}
              onDrop={(e) => handleDrop(status, e)}
              className={cn(
                "flex flex-col rounded-2xl border p-3 transition-colors",
                dragOverStatus === status ? "border-burnt-300 bg-burnt-100/30" : "border-navy-100 bg-cream-100/40"
              )}
            >
              <div className="mb-3 flex items-center gap-2 px-1">
                <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", config.iconClasses)}>
                  <Icon size={15} />
                </div>
                <h3 className="text-sm font-semibold text-navy-900">{TASK_STATUS_LABELS[status]}</h3>
                <span className="rounded-full bg-navy-100 px-2 py-0.5 text-xs font-semibold text-navy-500">
                  {items.length}
                </span>
              </div>

              <div className="flex-1 space-y-2.5">
                {visibleItems.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", task.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onOpen={() => setDrawerState({ mode: "edit", task })}
                  />
                ))}
                {items.length === 0 && (
                  <p className="px-1 py-2 text-sm text-navy-400">Nothing here.</p>
                )}
              </div>

              {isCompleted ? (
                items.length > COMPLETED_PREVIEW_COUNT && (
                  <a
                    href={completedHref}
                    className="mt-3 block px-1 text-sm font-medium text-burnt-600 hover:text-burnt-700"
                  >
                    {showAllCompleted ? "Show fewer" : `View all completed (${items.length})`}
                  </a>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => setDrawerState({ mode: "create", defaultStatus: status })}
                  className="mt-3 flex items-center gap-1.5 px-1 text-sm font-medium text-navy-400 hover:text-navy-700 cursor-pointer"
                >
                  <Plus size={14} /> Add task
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-navy-400">
        <GripVertical size={14} /> Drag and drop tasks to update status
      </p>

      {drawerState && (
        <TaskFormDrawer
          mode={drawerState.mode}
          task={drawerState.mode === "edit" ? drawerState.task : undefined}
          defaultStatus={drawerState.mode === "create" ? drawerState.defaultStatus : undefined}
          clients={clients}
          leads={leads}
          todoTypes={todoTypes}
          defaultTypeSelection={defaultTypeSelection}
          onClose={() => setDrawerState(null)}
        />
      )}
    </div>
  );
}
