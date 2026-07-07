"use client";

import { useRef, useState, useTransition } from "react";
import { Building2, Circle, Flag, List, Tag as TagIcon, Target, Trash2, UserCircle2 } from "lucide-react";
import { Input, Label, Select, FieldGroup, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { cn } from "@/lib/cn";
import { formatDateInput } from "@/lib/format";
import type { Task, TaskPriority, TaskStatus, TodoType } from "@/lib/types";
import { TASK_PRIORITY_LABELS, TASK_PRIORITY_ORDER, TASK_STATUS_LABELS, TASK_STATUS_ORDER } from "@/lib/types";
import { createTask, deleteTask, updateTask } from "@/lib/actions/tasks";

interface OwnerOption {
  id: string;
  companyName: string;
}

const STATUS_SELECT_TONE: Record<TaskStatus, string> = {
  TO_BE_DONE: "border-burnt-200! bg-burnt-100! text-burnt-600!",
  IN_PROGRESS: "border-blue-600/20! bg-blue-100! text-blue-600!",
  AWAITING_CLIENT_FEEDBACK: "border-gold-600/20! bg-gold-100! text-gold-600!",
  COMPLETED: "border-sage-600/20! bg-sage-100! text-sage-600!",
};

const PRIORITY_SELECT_TONE: Record<TaskPriority, string> = {
  LOW: "border-navy-200! bg-navy-100! text-navy-700!",
  MEDIUM: "border-gold-600/20! bg-gold-100! text-gold-600!",
  HIGH: "border-brick-600/20! bg-brick-100! text-brick-600!",
};

function taskTypeSelection(task: Task): string {
  return task.type === "CUSTOM" ? (task.todoTypeId ?? "") : task.type;
}

export function TaskFormDrawer({
  mode,
  task,
  defaultStatus,
  clients,
  leads,
  todoTypes,
  defaultTypeSelection,
  assignOptions,
  onClose,
}: {
  mode: "create" | "edit";
  task?: Task;
  defaultStatus?: TaskStatus;
  clients: OwnerOption[];
  leads: OwnerOption[];
  todoTypes: TodoType[];
  defaultTypeSelection: string;
  /** "Me" plus whoever else you're allowed to hand a to-do to. A to-do is only ever editable while it's on your own board, so "Me" is always the correct default here even in edit mode. */
  assignOptions: { value: string; label: string }[];
  onClose: () => void;
}) {
  const [typeSelection, setTypeSelection] = useState(task ? taskTypeSelection(task) : defaultTypeSelection);
  const [statusValue, setStatusValue] = useState<TaskStatus>(task?.status ?? defaultStatus ?? "TO_BE_DONE");
  const [priorityValue, setPriorityValue] = useState<TaskPriority>(task?.priority ?? "MEDIUM");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const activeTodoTypes = todoTypes.filter((t) => t.active || t.id === typeSelection);

  function resetForm() {
    formRef.current?.reset();
    setTypeSelection(defaultTypeSelection);
    setStatusValue(defaultStatus ?? "TO_BE_DONE");
    setPriorityValue("MEDIUM");
  }

  function handleDelete() {
    if (!task) return;
    if (!confirm(`Delete "${task.title}"? This can't be undone.`)) return;
    startTransition(async () => {
      await deleteTask(task.id, task.clientId, task.leadId);
      onClose();
    });
  }

  return (
    <Drawer
      title={mode === "edit" ? "Edit task" : "Create new task"}
      description={mode === "edit" ? "Update the details of this to-do." : "Add the details of your to-do."}
      onClose={onClose}
    >
      <form
        ref={formRef}
        action={(formData) => {
          setError(null);
          const keepOpen = formData.get("intent") === "continue";
          const clientId = formData.get("clientId");
          const leadId = formData.get("leadId");
          if (typeSelection === "CLIENT" && !clientId) {
            setError("Choose a client.");
            return;
          }
          if (typeSelection === "LEAD" && !leadId) {
            setError("Choose a lead.");
            return;
          }
          startTransition(async () => {
            try {
              if (mode === "edit" && task) {
                await updateTask(task.id, task.clientId, task.leadId, formData);
                onClose();
              } else {
                await createTask(formData);
                resetForm();
                if (!keepOpen) onClose();
              }
            } catch (e) {
              setError(e instanceof Error ? e.message : "Could not save this task.");
            }
          });
        }}
        className="space-y-4"
      >
        <FieldGroup>
          <Label htmlFor="task-title" required>
            Task title
          </Label>
          <Input
            id="task-title"
            name="title"
            required
            defaultValue={task?.title}
            placeholder="What needs to get done?"
          />
        </FieldGroup>

        {assignOptions.length > 1 && (
          <FieldGroup>
            <Label htmlFor="task-assigned-to">Assign to</Label>
            <Select id="task-assigned-to" name="assignedTo" defaultValue="" icon={UserCircle2}>
              {assignOptions.map((opt) => (
                <option key={opt.value || "self"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FieldGroup>
        )}

        <div className="grid grid-cols-2 gap-3">
          <FieldGroup>
            <Label htmlFor="task-type">Type</Label>
            <Select
              id="task-type"
              name="typeSelection"
              value={typeSelection}
              onChange={(e) => setTypeSelection(e.target.value)}
              icon={List}
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
          {typeSelection === "CLIENT" ? (
            <FieldGroup>
              <Label htmlFor="task-client">Client / Lead</Label>
              <Select id="task-client" name="clientId" defaultValue={task?.clientId ?? ""} icon={Building2}>
                <option value="" disabled>
                  Select a client or lead
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </Select>
            </FieldGroup>
          ) : typeSelection === "LEAD" ? (
            <FieldGroup>
              <Label htmlFor="task-lead">Client / Lead</Label>
              <Select id="task-lead" name="leadId" defaultValue={task?.leadId ?? ""} icon={Target}>
                <option value="" disabled>
                  Select a client or lead
                </option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.companyName}
                  </option>
                ))}
              </Select>
            </FieldGroup>
          ) : (
            <div />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FieldGroup>
            <Label htmlFor="task-status">Status</Label>
            <Select
              id="task-status"
              name="status"
              value={statusValue}
              onChange={(e) => setStatusValue(e.target.value as TaskStatus)}
              icon={Circle}
              className={cn("font-semibold", STATUS_SELECT_TONE[statusValue])}
            >
              {TASK_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {TASK_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="task-priority">Priority</Label>
            <Select
              id="task-priority"
              name="priority"
              value={priorityValue}
              onChange={(e) => setPriorityValue(e.target.value as TaskPriority)}
              icon={Flag}
              className={cn("font-semibold", PRIORITY_SELECT_TONE[priorityValue])}
            >
              {TASK_PRIORITY_ORDER.map((p) => (
                <option key={p} value={p}>
                  {TASK_PRIORITY_LABELS[p]}
                </option>
              ))}
            </Select>
          </FieldGroup>
        </div>

        <FieldGroup>
          <Label htmlFor="task-due-date">Due date</Label>
          <Input
            id="task-due-date"
            name="dueDate"
            type="date"
            defaultValue={formatDateInput(task?.dueDate)}
            className="min-w-0"
          />
        </FieldGroup>

        <FieldGroup>
          <Label htmlFor="task-tags">Tags</Label>
          <Input
            id="task-tags"
            name="tags"
            defaultValue={task?.tags.join(", ")}
            placeholder="Add tags…"
            icon={TagIcon}
          />
        </FieldGroup>

        <FieldGroup>
          <Label htmlFor="task-notes">Notes (optional)</Label>
          <Textarea
            id="task-notes"
            name="description"
            rows={3}
            defaultValue={task?.description ?? ""}
            placeholder="Add any additional notes, context, or details…"
          />
        </FieldGroup>

        {error && <p className="text-sm text-brick-600">{error}</p>}

        <div className="space-y-2 pt-2">
          {mode === "edit" ? (
            <>
              <Button type="submit" disabled={pending} className="w-full justify-center">
                {pending ? "Saving…" : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={pending}
                onClick={handleDelete}
                className="w-full justify-center"
              >
                <Trash2 size={16} /> Delete task
              </Button>
            </>
          ) : (
            <>
              <Button
                type="submit"
                name="intent"
                value="close"
                disabled={pending}
                className="w-full justify-center"
              >
                {pending ? "Saving…" : "Create task"}
              </Button>
              <Button
                type="submit"
                name="intent"
                value="continue"
                variant="secondary"
                disabled={pending}
                className="w-full justify-center"
              >
                {pending ? "Saving…" : "Create & add another"}
              </Button>
            </>
          )}
        </div>
      </form>
    </Drawer>
  );
}
