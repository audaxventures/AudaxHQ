import { CheckSquare, Eye, EyeOff } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { TaskFilterBar } from "@/components/todos/TaskFilterBar";
import { TodoWorkspace } from "@/components/todos/TodoWorkspace";
import { listAllTags, listTasks } from "@/lib/data/todos";
import { listClients } from "@/lib/data/clients";
import { listLeads } from "@/lib/data/leads";
import { listTodoTypes } from "@/lib/data/todoTypes";
import { getToday } from "@/lib/data/profile";
import { accessibleClientIdsFor } from "@/lib/data/clientAccess";
import { getCurrentUser } from "@/lib/currentUser";
import { formatDateInput } from "@/lib/format";
import type { Task, TaskPriority, TaskStatus, TaskType } from "@/lib/types";

function matchesDuePreset(task: Task, due: string | undefined, today: string): boolean {
  if (!due) return true;
  if (due === "none") return !task.dueDate;
  if (!task.dueDate) return false;
  const dueStr = formatDateInput(task.dueDate);
  if (due === "overdue") return dueStr < today && task.status !== "COMPLETED";
  if (due === "today") return dueStr === today;
  if (due === "week") {
    // Pure calendar-day arithmetic on the already-tz-resolved `today` string —
    // safe to do in UTC since there's no wall-clock/DST involved here.
    const weekAhead = new Date(`${today}T00:00:00Z`);
    weekAhead.setUTCDate(weekAhead.getUTCDate() + 7);
    return dueStr >= today && dueStr <= formatDateInput(weekAhead);
  }
  return true;
}

const PRIORITY_RANK: Record<TaskPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

function sortTasks(tasks: Task[], sort: string | undefined): Task[] {
  if (sort === "priority") return [...tasks].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
  if (sort === "created")
    return [...tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return tasks;
}

export default async function TodosPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    tag?: string;
    type?: string;
    todoTypeId?: string;
    status?: string;
    priority?: string;
    due?: string;
    sort?: string;
    completed?: string;
  }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const accessibleClientIds = user ? await accessibleClientIdsFor(user) : null;
  const [allTasks, allTags, clients, leads, todoTypes, today] = await Promise.all([
    listTasks({
      search: sp.q,
      tag: sp.tag,
      type: sp.type as TaskType | undefined,
      todoTypeId: sp.todoTypeId,
      status: sp.status as TaskStatus | undefined,
      priority: sp.priority as TaskPriority | undefined,
    }),
    listAllTags(),
    listClients({ accessibleClientIds }),
    listLeads(),
    listTodoTypes({ includeInactive: true }),
    getToday(),
  ]);

  const tasks = sortTasks(
    allTasks.filter((t) => matchesDuePreset(t, sp.due, today)),
    sp.sort
  );

  const showAllCompleted = sp.completed === "all";
  const filterStatus = sp.status as TaskStatus | undefined;

  const filterParams = {
    q: sp.q,
    type: sp.type,
    todoTypeId: sp.todoTypeId,
    status: sp.status,
    tag: sp.tag,
    priority: sp.priority,
    due: sp.due,
    sort: sp.sort,
  };

  function buildCompletedHref(nextShowAll: boolean) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filterParams)) {
      if (v) params.set(k, v);
    }
    if (nextShowAll) params.set("completed", "all");
    const qs = params.toString();
    return qs ? `/todos?${qs}` : "/todos";
  }

  const activeTodoTypes = todoTypes.filter((t) => t.active);
  const defaultTypeSelection =
    activeTodoTypes.find((t) => t.name === "General")?.id ?? activeTodoTypes[0]?.id ?? "CLIENT";

  return (
    <div>
      <PageHeader
        icon={CheckSquare}
        tone="gold"
        eyebrow="To-Dos"
        title="To-Dos"
        description="Everything on your plate  — sorted by what's due soonest"
        action={
          <LinkButton variant="secondary" href={buildCompletedHref(!showAllCompleted)}>
            {showAllCompleted ? <EyeOff size={16} /> : <Eye size={16} />}
            {showAllCompleted ? "Show fewer" : "View completed"}
          </LinkButton>
        }
      />

      <TaskFilterBar filters={filterParams} allTags={allTags} todoTypes={todoTypes} />

      <TodoWorkspace
        tasks={tasks}
        showAllCompleted={showAllCompleted}
        completedHref={buildCompletedHref(!showAllCompleted)}
        filterStatus={filterStatus}
        clients={clients.map((c) => ({ id: c.id, companyName: c.companyName }))}
        leads={leads.map((l) => ({ id: l.id, companyName: l.companyName }))}
        todoTypes={todoTypes}
        defaultTypeSelection={defaultTypeSelection}
        today={today}
      />
    </div>
  );
}
