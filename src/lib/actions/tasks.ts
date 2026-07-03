"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as tasks from "@/lib/data/todos";
import type { TaskStatus, TaskType } from "@/lib/types";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  tags: z.string().optional(),
  type: z.enum(["CLIENT", "LEAD", "GENERAL", "PERSONAL", "AUDAX_VENTURES", "H2MB", "OTHER"]),
  status: z.enum(["TO_BE_DONE", "IN_PROGRESS", "AWAITING_CLIENT_FEEDBACK", "COMPLETED"]).optional(),
});

function parseTaskForm(formData: FormData) {
  const parsed = taskSchema.parse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    tags: formData.get("tags") || undefined,
    type: formData.get("type") || "GENERAL",
    status: formData.get("status") || undefined,
  });
  const tagList = (parsed.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return {
    title: parsed.title,
    description: parsed.description ?? null,
    dueDate: parsed.dueDate ?? null,
    tags: tagList,
    type: parsed.type as TaskType,
    status: parsed.status as TaskStatus | undefined,
  };
}

function revalidateForTask(clientId?: string | null, leadId?: string | null) {
  revalidatePath("/todos");
  revalidatePath("/");
  if (clientId) revalidatePath(`/clients/${clientId}`);
  if (leadId) revalidatePath(`/leads/${leadId}`);
}

export async function createTask(formData: FormData) {
  const input = parseTaskForm(formData);
  const clientId = (formData.get("clientId") as string) || undefined;
  const leadId = (formData.get("leadId") as string) || undefined;
  await tasks.createTask({ ...input, clientId, leadId });
  revalidateForTask(clientId, leadId);
}

export async function createScopedTask(
  owner: { type: "CLIENT"; clientId: string } | { type: "LEAD"; leadId: string },
  formData: FormData
) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const tagsRaw = String(formData.get("tags") ?? "");
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  await tasks.createTask({
    title,
    description: (formData.get("description") as string) || null,
    dueDate: (formData.get("dueDate") as string) || null,
    tags,
    type: owner.type,
    clientId: owner.type === "CLIENT" ? owner.clientId : undefined,
    leadId: owner.type === "LEAD" ? owner.leadId : undefined,
  });
  revalidateForTask(
    owner.type === "CLIENT" ? owner.clientId : undefined,
    owner.type === "LEAD" ? owner.leadId : undefined
  );
}

export async function updateTask(
  id: string,
  clientId: string | null,
  leadId: string | null,
  formData: FormData
) {
  const input = parseTaskForm(formData);
  await tasks.updateTask(id, { ...input, clientId, leadId });
  revalidateForTask(clientId, leadId);
}

export async function setTaskStatus(
  id: string,
  clientId: string | null,
  leadId: string | null,
  status: TaskStatus
) {
  await tasks.setTaskStatus(id, status);
  revalidateForTask(clientId, leadId);
}

export async function deleteTask(id: string, clientId: string | null, leadId: string | null) {
  await tasks.deleteTask(id);
  revalidateForTask(clientId, leadId);
}
