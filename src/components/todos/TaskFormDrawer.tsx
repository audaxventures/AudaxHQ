"use client";

import { useRef, useState, useTransition } from "react";
import { Building2, Circle, Flag, List, Tag as TagIcon, Trash2, UserCircle2 } from "lucide-react";
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

/** Encodes which client/lead (if any) a task belongs to as a single dropdown value: "client:<id>" / "lead:<id>" / "" for neither. */
function taskOwnerValue(task: Task): string {
  if (task.type === "CLIENT" && task.clientId) return `client:${task.clientId}`;
  if (task.type === "LEAD" && task.leadId) return `lead:${task.leadId}`;
  return "";
}

function taskCategoryValue(task: Task): string {
  return task.type === "CUSTOM" ? (task.todoTypeId ?? "") : "";
}

/** defaultTypeSelection is normally a real todo_types id — it only falls back to the literal "CLIENT" when a business has no custom types left at all, in which case there's no sensible category default. */
function defaultCategoryValue(defaultTypeSelection: string): string {
  return defaultTypeSelection === "CLIENT" || defaultTypeSelection === "LEAD" ? "" : defaultTypeSelection;
}

/** Mirrors the assign-to <select>'s value convention: "" for the viewer themselves, "OWNER" for the owner, otherwise a team member's id. */
function defaultAssignValue(task: Task | undefined, currentAssigneeId: string | null): string {
  if (!task) return "";
  if (task.assignedToTeamMemberId === currentAssigneeId) return "";
  if (task.assignedToTeamMemberId === null) return "OWNER";
  return task.assignedToTeamMemberId;
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
  currentAssigneeId,
  onClose,
}: {
  mode: "create" | "edit";
  task?: Task;
  defaultStatus?: TaskStatus;
  clients: OwnerOption[];
  leads: OwnerOption[];
  todoTypes: TodoType[];
  defaultTypeSelection: string;
  /** "Me" plus whoever else you're allowed to hand a to-do to. */
  assignOptions: { value: string; label: string }[];
  /** The viewer's own board identity — null for the owner, a team member's id otherwise. Used to default the assign-to field to the task's actual current assignee rather than always "Me" (which would silently reassign a handed-off task back to the viewer on save). */
  currentAssigneeId: string | null;
  onClose: () => void;
}) {
  const [ownerValue, setOwnerValue] = useState(task ? taskOwnerValue(task) : "");
  const [categoryValue, setCategoryValue] = useState(
    task ? taskCategoryValue(task) : defaultCategoryValue(defaultTypeSelection)
  );
  const [statusValue, setStatusValue] = useState<TaskStatus>(task?.status ?? defaultStatus ?? "TO_BE_DONE");
  const [priorityValue, setPriorityValue] = useState<TaskPriority>(task?.priority ?? "MEDIUM");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const activeTodoTypes = todoTypes.filter((t) => t.active || t.id === categoryValue);

  const [ownerKind, ownerId] = ownerValue ? ownerValue.split(":") : ["", ""];
  const resolvedTypeSelection = ownerValue ? (ownerKind === "client" ? "CLIENT" : "LEAD") : categoryValue;
  const resolvedClientId = ownerKind === "client" ? ownerId : "";
  const resolvedLeadId = ownerKind === "lead" ? ownerId : "";

  function resetForm() {
    formRef.current?.reset();
    setOwnerValue("");
    setCategoryValue(defaultCategoryValue(defaultTypeSelection));
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
          if (!resolvedTypeSelection) {
            setError("Choose a client, lead, or category.");
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
            <Select
              id="task-assigned-to"
              name="assignedTo"
              defaultValue={defaultAssignValue(task, currentAssigneeId)}
              icon={UserCircle2}
            >
              {assignOptions.map((opt) => (
                <option key={opt.value || "self"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FieldGroup>
        )}

        <input type="hidden" name="typeSelection" value={resolvedTypeSelection} />
        <input type="hidden" name="clientId" value={resolvedClientId} />
        <input type="hidden" name="leadId" value={resolvedLeadId} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FieldGroup>
            <Label htmlFor="task-owner">Client / Lead</Label>
            <Select
              id="task-owner"
              value={ownerValue}
              onChange={(e) => setOwnerValue(e.target.value)}
              icon={Building2}
            >
              <option value="">No client or lead</option>
              {clients.length > 0 && (
                <optgroup label="Clients">
                  {clients.map((c) => (
                    <option key={c.id} value={`client:${c.id}`}>
                      {c.companyName}
                    </option>
                  ))}
                </optgroup>
              )}
              {leads.length > 0 && (
                <optgroup label="Leads">
                  {leads.map((l) => (
                    <option key={l.id} value={`lead:${l.id}`}>
                      {l.companyName}
                    </option>
                  ))}
                </optgroup>
              )}
            </Select>
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="task-category">Category</Label>
            <Select
              id="task-category"
              value={categoryValue}
              onChange={(e) => setCategoryValue(e.target.value)}
              disabled={!!ownerValue}
              icon={List}
            >
              {activeTodoTypes.length === 0 && <option value="">No categories yet</option>}
              {activeTodoTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </FieldGroup>
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
