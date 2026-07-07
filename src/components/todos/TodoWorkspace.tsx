"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Circle, GripVertical, ListTodo, Plus } from "lucide-react";
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

interface BoardColumn {
  key: string;
  label: string;
  /** Every underlying TaskStatus that lands in this column. */
  statuses: TaskStatus[];
  /** Status assigned when a task is dropped in from a different column. */
  primaryStatus: TaskStatus;
  icon: LucideIcon;
  iconClasses: string;
}

// "Waiting on Client" isn't its own column — those tasks live in In
// Progress (see TaskCard's own badge for that status) so the board stays
// three columns wide, but the underlying status is untouched.
const BOARD_COLUMNS: BoardColumn[] = [
  { key: "TO_BE_DONE", label: TASK_STATUS_LABELS.TO_BE_DONE, statuses: ["TO_BE_DONE"], primaryStatus: "TO_BE_DONE", icon: ListTodo, iconClasses: "bg-burnt-100 text-burnt-600" },
  {
    key: "IN_PROGRESS",
    label: TASK_STATUS_LABELS.IN_PROGRESS,
    statuses: ["IN_PROGRESS", "AWAITING_CLIENT_FEEDBACK"],
    primaryStatus: "IN_PROGRESS",
    icon: Circle,
    iconClasses: "bg-blue-100 text-blue-600",
  },
  { key: "COMPLETED", label: TASK_STATUS_LABELS.COMPLETED, statuses: ["COMPLETED"], primaryStatus: "COMPLETED", icon: CheckCircle2, iconClasses: "bg-sage-100 text-sage-600" },
];

const COMPLETED_PREVIEW_COUNT = 3;

export function TodoWorkspace({
  tasks,
  showAllCompleted,
  completedHref,
  filterStatus,
  clients,
  leads,
  todoTypes,
  defaultTypeSelection,
  assignOptions,
  today,
}: {
  tasks: Task[];
  showAllCompleted: boolean;
  completedHref: string;
  /** Set when the Status filter narrows to one status — shows only the matching column. */
  filterStatus?: TaskStatus;
  clients: OwnerOption[];
  leads: OwnerOption[];
  todoTypes: TodoType[];
  defaultTypeSelection: string;
  /** "Me" plus whoever else you're allowed to hand a to-do to. */
  assignOptions: { value: string; label: string }[];
  today: string;
}) {
  const [optimisticTasks, applyStatusChange] = useOptimistic(
    tasks,
    (state, update: { id: string; status: TaskStatus }) =>
      state.map((t) => (t.id === update.id ? { ...t, status: update.status } : t))
  );
  const [, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // The dashboard/mobile "Add To-Do" quick action links here with ?new=1 to
  // jump straight to the create drawer instead of landing on the board and
  // requiring a second click.
  const [drawerState, setDrawerState] = useState<DrawerState>(() =>
    searchParams.get("new") === "1" ? { mode: "create", defaultStatus: "TO_BE_DONE" } : null
  );
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const quickAddRef = useRef<HTMLFormElement>(null);
  const [quickAddPending, startQuickAdd] = useTransition();

  // Strip the ?new=1 param once handled so a later refresh doesn't reopen the drawer.
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("new");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [searchParams, router, pathname]);

  const visibleColumns = filterStatus
    ? BOARD_COLUMNS.filter((c) => c.statuses.includes(filterStatus))
    : BOARD_COLUMNS;

  function moveTaskToColumn(taskId: string, columnKey: string) {
    const column = BOARD_COLUMNS.find((c) => c.key === columnKey);
    const task = optimisticTasks.find((t) => t.id === taskId);
    // Already belongs in this column (e.g. a Waiting-on-Client task dropped
    // back into In Progress) — leave its actual status alone.
    if (!column || !task || column.statuses.includes(task.status)) return;
    const status = column.primaryStatus;
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
          visibleColumns.length > 1 ? "lg:grid-cols-3" : "lg:grid-cols-1"
        )}
      >
        {visibleColumns.map((column) => {
          const items = optimisticTasks.filter((t) => column.statuses.includes(t.status));
          const isCompleted = column.key === "COMPLETED";
          const visibleItems = isCompleted && !showAllCompleted ? items.slice(0, COMPLETED_PREVIEW_COUNT) : items;
          const Icon = column.icon;

          return (
            <div
              key={column.key}
              data-column-key={column.key}
              className={cn(
                "flex flex-col rounded-2xl border p-3 transition-colors",
                dragOverColumn === column.key ? "border-burnt-300 bg-burnt-100/30" : "border-navy-100 bg-cream-100/40"
              )}
            >
              <div className="mb-3 flex items-center gap-2 px-1">
                <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", column.iconClasses)}>
                  <Icon size={15} />
                </div>
                <h3 className="text-sm font-semibold text-navy-900">{column.label}</h3>
                <span className="rounded-full bg-navy-100 px-2 py-0.5 text-xs font-semibold text-navy-500">
                  {items.length}
                </span>
              </div>

              <div className="flex-1 space-y-2.5">
                {visibleItems.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    today={today}
                    onDragColumnChange={setDragOverColumn}
                    onDropOnColumn={(columnKey) => moveTaskToColumn(task.id, columnKey)}
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
                  onClick={() => setDrawerState({ mode: "create", defaultStatus: column.primaryStatus })}
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
          assignOptions={assignOptions}
          onClose={() => setDrawerState(null)}
        />
      )}
    </div>
  );
}
