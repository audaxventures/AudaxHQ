"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { Input, Textarea, Label, FieldGroup } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { createTodo } from "@/app/(app)/todos/actions";
import { cn } from "@/lib/cn";

export function NewTodoForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(() => {
          void createTodo(formData);
        });
        formRef.current?.reset();
      }}
      className="rounded-2xl border border-navy-100 bg-white/70 p-4 sm:p-5 mb-6"
    >
      <div className="flex items-center gap-2">
        <Input name="title" placeholder="Add a to-do…" required className="flex-1" />
        <Button type="submit" size="sm">
          <Plus size={16} /> Add
        </Button>
      </div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 flex items-center gap-1 text-xs font-medium text-navy-400 hover:text-navy-600 cursor-pointer"
      >
        <ChevronDown size={14} className={cn("transition-transform", expanded && "rotate-180")} />
        {expanded ? "Fewer details" : "Add tags, due date, notes"}
      </button>
      {expanded && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FieldGroup>
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input id="tags" name="tags" placeholder="admin, urgent, acme co." />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="dueDate">Due date</Label>
            <Input id="dueDate" name="dueDate" type="date" />
          </FieldGroup>
          <FieldGroup className="sm:col-span-2">
            <Label htmlFor="description">Notes</Label>
            <Textarea id="description" name="description" rows={2} />
          </FieldGroup>
        </div>
      )}
    </form>
  );
}
