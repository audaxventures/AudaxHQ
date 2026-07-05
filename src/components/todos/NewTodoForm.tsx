"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { Input, Textarea, Select, Label, FieldGroup } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { createTask } from "@/lib/actions/tasks";
import { cn } from "@/lib/cn";
import type { TodoType } from "@/lib/types";

interface Option {
  id: string;
  companyName: string;
}

export function NewTodoForm({
  clients,
  leads,
  todoTypes,
}: {
  clients: Option[];
  leads: Option[];
  todoTypes: TodoType[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [expanded, setExpanded] = useState(false);
  const activeTodoTypes = todoTypes.filter((t) => t.active);
  const defaultTypeSelection =
    activeTodoTypes.find((t) => t.name === "General")?.id ?? activeTodoTypes[0]?.id ?? "CLIENT";
  const [typeSelection, setTypeSelection] = useState(defaultTypeSelection);
  const [, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(() => {
          void createTask(formData);
        });
        formRef.current?.reset();
        setTypeSelection(defaultTypeSelection);
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
        {expanded ? "Fewer details" : "Add type, tags, due date, notes"}
      </button>
      {expanded && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FieldGroup>
            <Label htmlFor="typeSelection">Type</Label>
            <Select
              id="typeSelection"
              name="typeSelection"
              value={typeSelection}
              onChange={(e) => setTypeSelection(e.target.value)}
            >
              <option value="CLIENT">Client</option>
              <option value="LEAD">Lead</option>
              {activeTodoTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </FieldGroup>
          {typeSelection === "CLIENT" && (
            <FieldGroup>
              <Label htmlFor="clientId">Client</Label>
              <Select id="clientId" name="clientId" required defaultValue="">
                <option value="" disabled>
                  Select a client…
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </Select>
            </FieldGroup>
          )}
          {typeSelection === "LEAD" && (
            <FieldGroup>
              <Label htmlFor="leadId">Lead</Label>
              <Select id="leadId" name="leadId" required defaultValue="">
                <option value="" disabled>
                  Select a lead…
                </option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.companyName}
                  </option>
                ))}
              </Select>
            </FieldGroup>
          )}
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
