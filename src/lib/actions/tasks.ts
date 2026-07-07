"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as tasks from "@/lib/data/todos";
import { requireCurrentUser, requireClientAccess, requireLeadAccess } from "@/lib/currentUser";
import type { CurrentUser, TaskPriority, TaskStatus, TaskType } from "@/lib/types";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  tags: z.string().optional(),
  // "CLIENT", "LEAD", or a todo_types row id — see resolveTypeSelection.
  typeSelection: z.string().min(1, "Type is required"),
  status: z.enum(["TO_BE_DONE", "IN_PROGRESS", "AWAITING_CLIENT_FEEDBACK", "COMPLETED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
});

function selfId(user: CurrentUser): string | null {
  return user.role === "TEAM_MEMBER" ? user.teamMember.id : null;
}

/** The "Assign to" <select> submits "OWNER" or a team-member row id; "" (not present) means "me" (the current user). */
function resolveAssignee(formData: FormData, user: CurrentUser): string | null {
  const raw = formData.get("assignedTo");
  if (raw === null || raw === "") return selfId(user);
  if (raw === "OWNER") return null;
  return String(raw);
}

/** Defense in depth against posting a clientId/leadId outside the current business or (for team members) their access list — bypassing the already-scoped dropdown in the UI. */
async function assertOwnerAccess(clientId: string | undefined, leadId: string | undefined): Promise<void> {
  if (clientId) await requireClientAccess(clientId);
  else if (leadId) await requireLeadAccess(leadId);
}

/** The type <select> submits "CLIENT"/"LEAD" literally, or a todo_types row id for everything else. */
function resolveTypeSelection(typeSelection: string): { type: TaskType; todoTypeId: string | null } {
  if (typeSelection === "CLIENT") return { type: "CLIENT", todoTypeId: null };
  if (typeSelection === "LEAD") return { type: "LEAD", todoTypeId: null };
  return { type: "CUSTOM", todoTypeId: typeSelection };
}

function parseTaskForm(formData: FormData) {
  const parsed = taskSchema.parse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    tags: formData.get("tags") || undefined,
    typeSelection: formData.get("typeSelection") || "",
    status: formData.get("status") || undefined,
    priority: formData.get("priority") || undefined,
  });
  const tagList = (parsed.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const { type, todoTypeId } = resolveTypeSelection(parsed.typeSelection);
  return {
    title: parsed.title,
    description: parsed.description ?? null,
    dueDate: parsed.dueDate ?? null,
    tags: tagList,
    type,
    todoTypeId,
    status: parsed.status as TaskStatus | undefined,
    priority: parsed.priority as TaskPriority | undefined,
  };
}

function revalidateForTask(clientId?: string | null, leadId?: string | null) {
  revalidatePath("/todos");
  revalidatePath("/");
  if (clientId) revalidatePath(`/clients/${clientId}`);
  if (leadId) revalidatePath(`/leads/${leadId}`);
}

export async function createTask(formData: FormData) {
  const user = await requireCurrentUser();
  const input = parseTaskForm(formData);
  const clientId = (formData.get("clientId") as string) || undefined;
  const leadId = (formData.get("leadId") as string) || undefined;
  await assertOwnerAccess(clientId, leadId);
  const assignedToTeamMemberId = resolveAssignee(formData, user);
  await tasks.createTask(user.businessId, { ...input, clientId, leadId, assignedToTeamMemberId }, selfId(user));
  revalidateForTask(clientId, leadId);
}

export async function createScopedTask(
  owner: { type: "CLIENT"; clientId: string } | { type: "LEAD"; leadId: string },
  formData: FormData
) {
  const user =
    owner.type === "CLIENT" ? await requireClientAccess(owner.clientId) : await requireLeadAccess(owner.leadId);
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const tagsRaw = String(formData.get("tags") ?? "");
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  await tasks.createTask(
    user.businessId,
    {
      title,
      description: (formData.get("description") as string) || null,
      dueDate: (formData.get("dueDate") as string) || null,
      tags,
      type: owner.type,
      clientId: owner.type === "CLIENT" ? owner.clientId : undefined,
      leadId: owner.type === "LEAD" ? owner.leadId : undefined,
      assignedToTeamMemberId: selfId(user),
    },
    selfId(user)
  );
  revalidateForTask(
    owner.type === "CLIENT" ? owner.clientId : undefined,
    owner.type === "LEAD" ? owner.leadId : undefined
  );
}

export async function updateTask(
  id: string,
  previousClientId: string | null,
  previousLeadId: string | null,
  formData: FormData
) {
  const user = await requireCurrentUser();
  const input = parseTaskForm(formData);
  const clientId = (formData.get("clientId") as string) || undefined;
  const leadId = (formData.get("leadId") as string) || undefined;
  await assertOwnerAccess(clientId, leadId);
  const assignedToTeamMemberId = resolveAssignee(formData, user);
  await tasks.updateTask(
    id,
    user.businessId,
    { ...input, clientId: clientId ?? null, leadId: leadId ?? null, assignedToTeamMemberId },
    selfId(user)
  );
  // Revalidate both the previous and (possibly changed) new owner's page, so
  // reassigning a task's client/lead doesn't leave stale data on either.
  revalidateForTask(previousClientId, previousLeadId);
  revalidateForTask(clientId, leadId);
}

export async function setTaskStatus(
  id: string,
  clientId: string | null,
  leadId: string | null,
  status: TaskStatus
) {
  const user = await requireCurrentUser();
  await tasks.setTaskStatus(id, user.businessId, status, selfId(user));
  revalidateForTask(clientId, leadId);
}

export async function deleteTask(id: string, clientId: string | null, leadId: string | null) {
  const user = await requireCurrentUser();
  await tasks.deleteTask(id, user.businessId, selfId(user));
  revalidateForTask(clientId, leadId);
}
