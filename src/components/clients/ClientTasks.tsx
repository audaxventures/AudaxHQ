"use client";

import { useOptimistic, useTransition, useRef } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ClientTask } from "@/lib/types";
import {
  addClientTask,
  deleteClientTask,
  toggleClientTask,
} from "@/app/(app)/clients/actions";

export function ClientTasks({
  clientId,
  tasks,
}: {
  clientId: string;
  tasks: ClientTask[];
}) {
  const [optimisticTasks, applyOptimistic] = useOptimistic(
    tasks,
    (state, update: { type: "toggle"; id: string; done: boolean } | { type: "remove"; id: string }) => {
      if (update.type === "toggle") {
        return state.map((t) => (t.id === update.id ? { ...t, done: update.done } : t));
      }
      return state.filter((t) => t.id !== update.id);
    }
  );
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div>
      {optimisticTasks.length === 0 ? (
        <p className="text-sm text-navy-400 py-2">No tasks yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {optimisticTasks.map((task) => (
            <li
              key={task.id}
              className="group flex items-center gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-cream-100/60"
            >
              <button
                type="button"
                onClick={() =>
                  startTransition(async () => {
                    applyOptimistic({ type: "toggle", id: task.id, done: !task.done });
                    await toggleClientTask(clientId, task.id, !task.done);
                  })
                }
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors cursor-pointer",
                  task.done
                    ? "bg-sage-600 border-sage-600 text-white"
                    : "border-navy-300 hover:border-navy-500"
                )}
                aria-label={task.done ? "Mark as not done" : "Mark as done"}
              >
                {task.done && (
                  <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
                    <path
                      d="M2 6l2.5 2.5L10 3"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
              <span
                className={cn(
                  "flex-1 text-sm",
                  task.done ? "text-navy-400 line-through" : "text-navy-800"
                )}
              >
                {task.title}
              </span>
              <button
                type="button"
                onClick={() =>
                  startTransition(async () => {
                    applyOptimistic({ type: "remove", id: task.id });
                    await deleteClientTask(clientId, task.id);
                  })
                }
                className="opacity-0 group-hover:opacity-100 text-navy-300 hover:text-brick-600 transition-opacity cursor-pointer"
                aria-label="Delete task"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        ref={formRef}
        action={(formData) => {
          const title = String(formData.get("title") ?? "").trim();
          formRef.current?.reset();
          startTransition(async () => {
            await addClientTask(clientId, formData);
          });
          void title;
        }}
        className="mt-3 flex items-center gap-2"
      >
        <input
          name="title"
          placeholder="Add a task…"
          required
          className="flex-1 rounded-lg border border-navy-200 bg-cream-50 px-3 py-1.5 text-sm text-navy-900 placeholder:text-navy-400 focus:outline-none focus:border-burnt-400 focus:ring-2 focus:ring-burnt-100"
        />
        <button
          type="submit"
          className="flex items-center justify-center rounded-lg bg-navy-100 p-1.5 text-navy-600 hover:bg-navy-200 transition-colors cursor-pointer"
          aria-label="Add task"
        >
          <Plus size={16} />
        </button>
      </form>
    </div>
  );
}
