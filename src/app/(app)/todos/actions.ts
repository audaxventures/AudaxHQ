"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as todos from "@/lib/data/todos";

const todoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  tags: z.string().optional(),
});

function parseTodoForm(formData: FormData) {
  const parsed = todoSchema.parse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    tags: formData.get("tags") || undefined,
  });
  const tags = (parsed.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return {
    title: parsed.title,
    description: parsed.description ?? null,
    dueDate: parsed.dueDate ?? null,
    tags,
  };
}

export async function createTodo(formData: FormData) {
  const input = parseTodoForm(formData);
  await todos.createTodo(input);
  revalidatePath("/todos");
  revalidatePath("/");
}

export async function updateTodo(id: string, formData: FormData) {
  const input = parseTodoForm(formData);
  await todos.updateTodo(id, input);
  revalidatePath("/todos");
  revalidatePath("/");
}

export async function setTodoStatus(id: string, done: boolean) {
  await todos.setTodoStatus(id, done ? "DONE" : "OPEN");
  revalidatePath("/todos");
  revalidatePath("/");
}

export async function deleteTodo(id: string) {
  await todos.deleteTodo(id);
  revalidatePath("/todos");
  revalidatePath("/");
}
