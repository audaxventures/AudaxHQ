import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { NewTodoForm } from "@/components/todos/NewTodoForm";
import { TagFilterBar } from "@/components/todos/TagFilterBar";
import { TodoItem } from "@/components/todos/TodoItem";
import { listAllTags, listTodos } from "@/lib/data/todos";

export default async function TodosPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const [todos, allTags] = await Promise.all([listTodos({ tag }), listAllTags()]);

  const open = todos.filter((t) => t.status === "OPEN");
  const done = todos.filter((t) => t.status === "DONE");

  return (
    <div>
      <PageHeader
        eyebrow="To-Dos"
        title="To-Dos"
        description="Everything on your plate, tagged and sorted by what's due soonest."
      />
      <NewTodoForm />
      <TagFilterBar tags={allTags} active={tag} />

      {todos.length === 0 ? (
        <EmptyState title="Nothing here" description="Add a to-do above to get started." />
      ) : (
        <div className="space-y-8">
          <div>
            <h3 className="font-heading text-sm font-medium uppercase tracking-wide text-navy-500 mb-2">
              Open ({open.length})
            </h3>
            {open.length === 0 ? (
              <p className="text-sm text-navy-400 px-3 py-2">Nothing open — nice work.</p>
            ) : (
              <Card className="p-2">
                <ul className="divide-y divide-navy-100">
                  {open.map((todo) => (
                    <TodoItem key={todo.id} todo={todo} allTags={allTags} />
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {done.length > 0 && (
            <div>
              <h3 className="font-heading text-sm font-medium uppercase tracking-wide text-navy-500 mb-2">
                Done ({done.length})
              </h3>
              <Card className="p-2 opacity-70">
                <ul className="divide-y divide-navy-100">
                  {done.map((todo) => (
                    <TodoItem key={todo.id} todo={todo} allTags={allTags} />
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
