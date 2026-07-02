"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import * as clients from "@/lib/data/clients";
import { markLeadConverted } from "@/lib/data/leads";

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  type: z.enum(["PROJECT", "RECURRING"]),
  status: z.enum(["ACTIVE", "PAUSED", "CHURNED"]),
  rate: z.coerce.number().min(0),
  startDate: z.string().optional(),
});

function parseClientForm(formData: FormData) {
  const parsed = clientSchema.parse({
    name: formData.get("name"),
    company: formData.get("company") || undefined,
    contactEmail: formData.get("contactEmail") || undefined,
    contactPhone: formData.get("contactPhone") || undefined,
    type: formData.get("type"),
    status: formData.get("status"),
    rate: formData.get("rate") || 0,
    startDate: formData.get("startDate") || undefined,
  });
  return {
    ...parsed,
    company: parsed.company ?? null,
    contactEmail: parsed.contactEmail ?? null,
    contactPhone: parsed.contactPhone ?? null,
    startDate: parsed.startDate ?? null,
  };
}

export async function createClient(formData: FormData) {
  const input = parseClientForm(formData);
  const fromLeadId = formData.get("fromLeadId");

  const client = await clients.createClient(input);

  if (fromLeadId && typeof fromLeadId === "string") {
    await markLeadConverted(fromLeadId, client.id);
    revalidatePath(`/leads/${fromLeadId}`);
    revalidatePath("/leads");
  }

  revalidatePath("/clients");
  revalidatePath("/");
  redirect(`/clients/${client.id}`);
}

export async function updateClient(id: string, formData: FormData) {
  const input = parseClientForm(formData);
  await clients.updateClient(id, input);
  revalidatePath(`/clients/${id}`);
  revalidatePath("/clients");
  revalidatePath("/");
}

export async function deleteClient(id: string) {
  await clients.deleteClient(id);
  revalidatePath("/clients");
  revalidatePath("/");
  redirect("/clients");
}

export async function addClientTask(clientId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  await clients.addClientTask(clientId, title);
  revalidatePath(`/clients/${clientId}`);
}

export async function toggleClientTask(clientId: string, taskId: string, done: boolean) {
  await clients.toggleClientTask(taskId, done);
  revalidatePath(`/clients/${clientId}`);
}

export async function deleteClientTask(clientId: string, taskId: string) {
  await clients.deleteClientTask(taskId);
  revalidatePath(`/clients/${clientId}`);
}

export async function addClientNote(clientId: string, formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  await clients.addClientNote(clientId, body);
  revalidatePath(`/clients/${clientId}`);
}

export async function addClientLink(clientId: string, formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!label || !url) return;
  await clients.addClientLink(clientId, label, url);
  revalidatePath(`/clients/${clientId}`);
}

export async function deleteClientLink(clientId: string, linkId: string) {
  await clients.deleteClientLink(linkId);
  revalidatePath(`/clients/${clientId}`);
}

const invoiceSchema = z.object({
  amount: z.coerce.number().min(0),
  status: z.enum(["NOT_INVOICED", "INVOICED", "PAID"]),
  invoicedDate: z.string().optional(),
  paidDate: z.string().optional(),
});

export async function updateProjectInvoice(clientId: string, formData: FormData) {
  const parsed = invoiceSchema.parse({
    amount: formData.get("amount"),
    status: formData.get("status"),
    invoicedDate: formData.get("invoicedDate") || undefined,
    paidDate: formData.get("paidDate") || undefined,
  });
  await clients.updateProjectInvoice(clientId, {
    amount: parsed.amount,
    status: parsed.status,
    invoicedDate: parsed.invoicedDate ?? null,
    paidDate: parsed.paidDate ?? null,
  });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
}

export async function updateRecurringInvoice(
  clientId: string,
  invoiceId: string,
  formData: FormData
) {
  const parsed = invoiceSchema.parse({
    amount: formData.get("amount"),
    status: formData.get("status"),
    invoicedDate: formData.get("invoicedDate") || undefined,
    paidDate: formData.get("paidDate") || undefined,
  });
  await clients.updateRecurringInvoice(invoiceId, {
    amount: parsed.amount,
    status: parsed.status,
    invoicedDate: parsed.invoicedDate ?? null,
    paidDate: parsed.paidDate ?? null,
  });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
}
