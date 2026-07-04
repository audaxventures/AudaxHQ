import { CheckSquare, ListChecks, ListTodo } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PanelHeading } from "@/components/ui/PanelHeading";
import { NewTodoForm } from "@/components/todos/NewTodoForm";
import { TaskFilterBar } from "@/components/todos/TaskFilterBar";
import { TodoItem } from "@/components/todos/TodoItem";
import { listAllTags, listTasks } from "@/lib/data/todos";
import { listClients } from "@/lib/data/clients";
import { listLeads } from "@/lib/data/leads";
import type { TaskStatus, TaskType } from "@/lib/types";

export default async function TodosPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; type?: string; status?: string }>;
}) {
  const { tag, type, status } = await searchParams;
  const [tasks, allTags, clients, leads] = await Promise.all([
    listTasks({
      tag,
      type: type as TaskType | undefined,
      status: status as TaskStatus | undefined,
    }),
    listAllTags(),
    listClients(),
    listLeads(),
  ]);

  const open = tasks.filter((t) => t.status !== "COMPLETED");
  const done = tasks.filter((t) => t.status === "COMPLETED");

  return (
    <div>
      <PageHeader
        icon={CheckSquare}
        tone="gold"
        eyebrow="To-Dos"
        title="To-Dos"
        description="Everything on your plate — general, client, and lead tasks — sorted by what's due soonest."
      />
      <NewTodoForm
        clients={clients.map((c) => ({ id: c.id, companyName: c.companyName }))}
        leads={leads.map((l) => ({ id: l.id, companyName: l.companyName }))}
      />
      <TaskFilterBar type={type} status={status} tag={tag} allTags={allTags} />

      {tasks.length === 0 ? (
        <EmptyState title="Nothing here" description="Add a to-do above to get started." />
      ) : (
        <div className="space-y-8">
          <div>
            <Card tone="gold" className="p-4">
              <PanelHeading icon={ListTodo} tone="gold" title={`Open (${open.length})`} />
              {open.length === 0 ? (
                <p className="text-sm text-navy-400 px-3 py-2">Nothing open — nice work.</p>
              ) : (
                <ul className="divide-y divide-navy-100">
                  {open.map((task) => (
                    <TodoItem key={task.id} task={task} allTags={allTags} />
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {done.length > 0 && (
            <div>
              <Card tone="slate" className="p-4 opacity-70">
                <PanelHeading icon={ListChecks} tone="slate" title={`Completed (${done.length})`} />
                <ul className="divide-y divide-navy-100">
                  {done.map((task) => (
                    <TodoItem key={task.id} task={task} allTags={allTags} />
                  ))}
                </ul>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
