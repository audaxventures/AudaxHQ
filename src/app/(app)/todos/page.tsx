import { CheckSquare } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TaskFilterBar } from "@/components/todos/TaskFilterBar";
import { TodoWorkspace } from "@/components/todos/TodoWorkspace";
import { listAllTags, listTasks } from "@/lib/data/todos";
import { listClients } from "@/lib/data/clients";
import { listLeads } from "@/lib/data/leads";
import { listTodoTypes } from "@/lib/data/todoTypes";
import { listTeamMembers } from "@/lib/data/teamMembers";
import { getBusinessToday } from "@/lib/data/businesses";
import { accessibleClientIdsFor } from "@/lib/data/clientAccess";
import { requireCurrentUser } from "@/lib/currentUser";
import { formatDateInput } from "@/lib/format";
import type { CurrentUser, Task, TaskPriority, TaskStatus, TaskType, TeamMember } from "@/lib/types";

/**
 * "Me" always comes first (value "" — omitted from the submitted form data
 * means "assign to myself"); everyone else you can hand a to-do to follows.
 * The owner sometimes also has their own row in team_members (e.g. to track
 * their own billable hours in the tracker) — that row is filtered out here
 * since "Me"/"Owner" already represent that same person, and leaving it in
 * would show the owner's name twice.
 */
function buildAssignOptions(
  user: CurrentUser,
  teamMembers: TeamMember[],
  ownerName: string
): { value: string; label: string }[] {
  const otherMembers = teamMembers.filter((tm) => tm.name !== ownerName);
  const options = [{ value: "", label: "Me" }];
  if (user.role === "TEAM_MEMBER") {
    options.push({ value: "OWNER", label: "Owner" });
    for (const tm of otherMembers) {
      if (tm.id !== user.teamMember.id) options.push({ value: tm.id, label: tm.name });
    }
  } else {
    for (const tm of otherMembers) options.push({ value: tm.id, label: tm.name });
  }
  return options;
}

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
  }>;
}) {
  const sp = await searchParams;
  const user = await requireCurrentUser();
  const accessibleClientIds = await accessibleClientIdsFor(user);
  const selfAssigneeId = user.role === "TEAM_MEMBER" ? user.teamMember.id : null;
  const [allTasks, allTags, clients, leads, todoTypes, teamMembers, today] = await Promise.all([
    listTasks({
      search: sp.q,
      tag: sp.tag,
      type: sp.type as TaskType | undefined,
      todoTypeId: sp.todoTypeId,
      status: sp.status as TaskStatus | undefined,
      priority: sp.priority as TaskPriority | undefined,
      // Your own to-dos plus anything you handed off to someone else — never
      // a colleague's unrelated to-dos.
      visibleTo: selfAssigneeId,
    }),
    listAllTags(),
    listClients({ accessibleClientIds }),
    listLeads(),
    listTodoTypes({ includeInactive: true }),
    listTeamMembers(),
    getBusinessToday(user.businessId),
  ]);
  const assignOptions = buildAssignOptions(user, teamMembers, user.business.ownerName);

  const tasks = sortTasks(
    allTasks.filter((t) => matchesDuePreset(t, sp.due, today)),
    sp.sort
  );

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
      />

      <TaskFilterBar filters={filterParams} allTags={allTags} todoTypes={todoTypes} />

      <TodoWorkspace
        tasks={tasks}
        filterStatus={filterStatus}
        clients={clients.map((c) => ({ id: c.id, companyName: c.companyName }))}
        leads={leads.map((l) => ({ id: l.id, companyName: l.companyName }))}
        todoTypes={todoTypes}
        defaultTypeSelection={defaultTypeSelection}
        assignOptions={assignOptions}
        currentAssigneeId={selfAssigneeId}
        today={today}
      />
    </div>
  );
}
