"use client";

import { useEffect, useOptimistic, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Circle, GripVertical, Inbox, ListTodo, Plus, Send } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { cn } from "@/lib/cn";
import { createTask, setTaskStatus } from "@/lib/actions/tasks";
import { TASK_STATUS_LABELS } from "@/lib/types";
import type { Task, TaskStatus, TodoType } from "@/lib/types";
import { TaskCard } from "@/components/todos/TaskCard";
import { TaskFormDrawer } from "@/components/todos/TaskFormDrawer";

// Tailwind's lg breakpoint is also where the board switches from a single
// stacked column to a side-by-side grid — below it, native drag conflicts
// with the page's own vertical scroll gesture, so drag is disabled there.
const DESKTOP_BOARD_QUERY = "(min-width: 1024px)";

function subscribeToBoardQuery(callback: () => void) {
  const mql = window.matchMedia(DESKTOP_BOARD_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function useIsMobileBoard(): boolean {
  return useSyncExternalStore(
    subscribeToBoardQuery,
    () => !window.matchMedia(DESKTOP_BOARD_QUERY).matches,
    () => false
  );
}

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
  /**
   * "own": to-dos the viewer both created and is assigned. "assignedToMe":
   * someone else created it but it's on the viewer's board now. "handedOff":
   * the viewer created it but assigned it to someone else. Completed to-dos
   * never get their own column — they're reachable via the "View completed"
   * drawer regardless of scope, so they don't linger on the board.
   */
  scope: "own" | "handedOff" | "assignedToMe";
}

// "Waiting on Client" isn't its own column — those tasks live in In
// Progress (see TaskCard's own badge for that status) so the board stays
// four columns wide, but the underlying status is untouched.
const BOARD_COLUMNS: BoardColumn[] = [
  {
    key: "TO_BE_DONE",
    label: TASK_STATUS_LABELS.TO_BE_DONE,
    statuses: ["TO_BE_DONE"],
    primaryStatus: "TO_BE_DONE",
    icon: ListTodo,
    iconClasses: "bg-burnt-100 text-burnt-600",
    scope: "own",
  },
  {
    key: "IN_PROGRESS",
    label: TASK_STATUS_LABELS.IN_PROGRESS,
    statuses: ["IN_PROGRESS", "AWAITING_CLIENT_FEEDBACK"],
    primaryStatus: "IN_PROGRESS",
    icon: Circle,
    iconClasses: "bg-blue-100 text-blue-600",
    scope: "own",
  },
  {
    key: "ASSIGNED_TO_ME",
    label: "Assigned to me",
    statuses: ["TO_BE_DONE", "IN_PROGRESS", "AWAITING_CLIENT_FEEDBACK"],
    primaryStatus: "TO_BE_DONE",
    icon: Inbox,
    iconClasses: "bg-sage-100 text-sage-600",
    scope: "assignedToMe",
  },
  {
    key: "ASSIGNED_TO_OTHERS",
    label: "Assigned to others",
    statuses: ["TO_BE_DONE", "IN_PROGRESS", "AWAITING_CLIENT_FEEDBACK"],
    primaryStatus: "TO_BE_DONE",
    icon: Send,
    iconClasses: "bg-violet-100 text-violet-600",
    scope: "handedOff",
  },
];

function taskScope(task: Task, currentAssigneeId: string | null): "own" | "handedOff" | "assignedToMe" {
  if (task.assignedToTeamMemberId !== currentAssigneeId) return "handedOff";
  return task.createdByTeamMemberId === currentAssigneeId ? "own" : "assignedToMe";
}

export function TodoWorkspace({
  tasks,
  filterStatus,
  clients,
  leads,
  todoTypes,
  defaultTypeSelection,
  assignOptions,
  currentAssigneeId,
  today,
}: {
  tasks: Task[];
  /** Set when the Status filter narrows to one status — shows only the matching column. */
  filterStatus?: TaskStatus;
  clients: OwnerOption[];
  leads: OwnerOption[];
  todoTypes: TodoType[];
  defaultTypeSelection: string;
  /** "Me" plus whoever else you're allowed to hand a to-do to. */
  assignOptions: { value: string; label: string }[];
  /** The viewer's own board identity — null for the owner, a team member's id otherwise. Distinguishes "own" tasks from ones handed off to someone else. */
  currentAssigneeId: string | null;
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
  const [showCompletedDrawer, setShowCompletedDrawer] = useState(false);
  const quickAddRef = useRef<HTMLFormElement>(null);
  const [quickAddPending, startQuickAdd] = useTransition();
  const isMobileBoard = useIsMobileBoard();
  // Which single column is showing on the mobile tab strip — desktop
  // ignores this entirely and shows every column side by side.
  const [mobileColumnKey, setMobileColumnKey] = useState<string | null>(null);

  // Strip the ?new=1 param once handled so a later refresh doesn't reopen the drawer.
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("new");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [searchParams, router, pathname]);

  // Reuse the same "who can I hand this off to" list to label handed-off
  // cards, keyed the same way the assign-to <select> submits values: ""
  // for the viewer themselves, "OWNER" for the owner, otherwise a team
  // member's id.
  const assigneeLabelById = new Map(assignOptions.map((o) => [o.value, o.label]));
  function assigneeLabelFor(task: Task): string {
    return assigneeLabelById.get(task.assignedToTeamMemberId ?? "OWNER") ?? "a teammate";
  }

  const visibleColumns = (
    filterStatus ? BOARD_COLUMNS.filter((c) => c.statuses.includes(filterStatus)) : BOARD_COLUMNS
  ).filter((c) => c.scope === "own" || assignOptions.length > 1);

  // Falls back to the first visible column whenever the stored key no
  // longer matches one (first render, or the status filter just changed
  // which columns exist) — recomputed every render instead of an effect.
  const activeMobileColumnKey =
    mobileColumnKey && visibleColumns.some((c) => c.key === mobileColumnKey)
      ? mobileColumnKey
      : (visibleColumns[0]?.key ?? null);

  const completedTasks = [...optimisticTasks]
    .filter((t) => t.status === "COMPLETED")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  function itemsForColumn(column: BoardColumn): Task[] {
    return optimisticTasks.filter(
      (t) => column.statuses.includes(t.status) && t.status !== "COMPLETED" && taskScope(t, currentAssigneeId) === column.scope
    );
  }

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
        <Button variant="secondary" onClick={() => setShowCompletedDrawer(true)}>
          <CheckCircle2 size={16} /> Completed ({completedTasks.length})
        </Button>
      </div>

      {visibleColumns.length === 0 && (
        <p className="rounded-2xl border border-navy-100 bg-cream-100/40 px-4 py-6 text-center text-sm text-navy-400">
          Nothing to show for this filter.
        </p>
      )}

      {visibleColumns.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {visibleColumns.map((column) => {
            const active = column.key === activeMobileColumnKey;
            const Icon = column.icon;
            return (
              <button
                key={column.key}
                type="button"
                onClick={() => setMobileColumnKey(column.key)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                  active
                    ? "border-navy-900 bg-navy-900 text-cream-50"
                    : "border-navy-200 text-navy-600 hover:border-navy-400"
                )}
              >
                <Icon size={14} />
                {column.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                    active ? "bg-white/20" : "bg-navy-100 text-navy-500"
                  )}
                >
                  {itemsForColumn(column).length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div
        className={cn(
          "grid grid-cols-1 gap-4",
          visibleColumns.length >= 4 ? "lg:grid-cols-4" : visibleColumns.length > 1 ? "lg:grid-cols-3" : "lg:grid-cols-1"
        )}
      >
        {visibleColumns.map((column) => {
          const items = itemsForColumn(column);
          const isConsolidatedColumn = column.scope !== "own";
          const isHandedOffColumn = column.scope === "handedOff";
          const Icon = column.icon;

          return (
            <div
              key={column.key}
              data-column-key={column.key}
              className={cn(
                "flex-col rounded-2xl border p-3 transition-colors",
                column.key === activeMobileColumnKey ? "flex" : "hidden lg:flex",
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
                {items.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    today={today}
                    draggable={!isConsolidatedColumn && !isMobileBoard}
                    assignedToLabel={isHandedOffColumn ? assigneeLabelFor(task) : undefined}
                    onDragColumnChange={setDragOverColumn}
                    onDropOnColumn={(columnKey) => moveTaskToColumn(task.id, columnKey)}
                    onOpen={() => setDrawerState({ mode: "edit", task })}
                  />
                ))}
                {items.length === 0 && (
                  <p className="px-1 py-2 text-sm text-navy-400">Nothing here.</p>
                )}
              </div>

              {column.scope === "own" && (
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

      <p className="mt-6 hidden items-center justify-center gap-1.5 text-xs text-navy-400 lg:flex">
        <GripVertical size={14} /> Drag and drop tasks to update status
      </p>

      {showCompletedDrawer && (
        <Drawer
          title="Completed tasks"
          description="Everything you've finished — reopen one to bring it back onto the board."
          onClose={() => setShowCompletedDrawer(false)}
        >
          <div className="space-y-2.5">
            {completedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                today={today}
                draggable={false}
                onOpen={() => setDrawerState({ mode: "edit", task })}
              />
            ))}
            {completedTasks.length === 0 && <p className="text-sm text-navy-400">Nothing completed yet.</p>}
          </div>
        </Drawer>
      )}

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
          currentAssigneeId={currentAssigneeId}
          onClose={() => setDrawerState(null)}
        />
      )}
    </div>
  );
}
