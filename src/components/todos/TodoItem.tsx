"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, X, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Input, Textarea, Label, FieldGroup } from "@/components/ui/Field";
import { formatDate, isOverdue } from "@/lib/format";
import type { Todo } from "@/lib/types";
import { deleteTodo, setTodoStatus, updateTodo } from "@/app/(app)/todos/actions";

export function TodoItem({ todo, allTags }: { todo: Todo; allTags: string[] }) {
  const [editing, setEditing] = useState(false);
  const [optimisticDone, setOptimisticDone] = useState(todo.status === "DONE");
  const [, startTransition] = useTransition();

  const overdue = todo.status === "OPEN" && isOverdue(todo.dueDate);

  if (editing) {
    return (
      <li className="rounded-xl border border-navy-200 bg-cream-100/40 p-4">
        <form
          action={(formData) => {
            startTransition(async () => {
              await updateTodo(todo.id, formData);
            });
            setEditing(false);
          }}
          className="space-y-3"
        >
          <FieldGroup>
            <Label htmlFor={`title-${todo.id}`}>Title</Label>
            <Input id={`title-${todo.id}`} name="title" defaultValue={todo.title} required />
          </FieldGroup>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldGroup>
              <Label htmlFor={`tags-${todo.id}`}>Tags</Label>
              <Input
                id={`tags-${todo.id}`}
                name="tags"
                defaultValue={todo.tags.join(", ")}
                list="all-tags"
              />
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor={`due-${todo.id}`}>Due date</Label>
              <Input
                id={`due-${todo.id}`}
                name="dueDate"
                type="date"
                defaultValue={todo.dueDate ? todo.dueDate.slice(0, 10) : ""}
              />
            </FieldGroup>
          </div>
          <FieldGroup>
            <Label htmlFor={`desc-${todo.id}`}>Notes</Label>
            <Textarea id={`desc-${todo.id}`} name="description" rows={2} defaultValue={todo.description ?? ""} />
          </FieldGroup>
          <datalist id="all-tags">
            {allTags.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex items-center gap-1 rounded-lg bg-navy-900 px-3 py-1.5 text-sm font-medium text-cream-50 hover:bg-navy-800 cursor-pointer"
            >
              <Check size={14} /> Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex items-center gap-1 rounded-lg border border-navy-200 px-3 py-1.5 text-sm font-medium text-navy-600 hover:bg-navy-100 cursor-pointer"
            >
              <X size={14} /> Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="group flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-cream-100/60 transition-colors">
      <button
        type="button"
        onClick={() =>
          startTransition(async () => {
            setOptimisticDone((v) => !v);
            await setTodoStatus(todo.id, !optimisticDone);
          })
        }
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors cursor-pointer",
          optimisticDone
            ? "bg-sage-600 border-sage-600 text-white"
            : "border-navy-300 hover:border-navy-500"
        )}
        aria-label={optimisticDone ? "Mark as open" : "Mark as done"}
      >
        {optimisticDone && (
          <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
            <path d="M2 6l2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", optimisticDone ? "text-navy-400 line-through" : "text-navy-900")}>
          {todo.title}
        </p>
        {todo.description && (
          <p className="mt-0.5 text-sm text-navy-500 whitespace-pre-wrap">{todo.description}</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {todo.dueDate && (
            <Badge tone={overdue ? "brick" : "slate"}>{overdue ? "Overdue " : ""}{formatDate(todo.dueDate)}</Badge>
          )}
          {todo.tags.map((tag) => (
            <Badge key={tag} tone="burnt">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="p-1.5 text-navy-300 hover:text-navy-600 cursor-pointer"
          aria-label="Edit"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={() => startTransition(async () => deleteTodo(todo.id))}
          className="p-1.5 text-navy-300 hover:text-brick-600 cursor-pointer"
          aria-label="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}
