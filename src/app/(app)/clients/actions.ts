"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import * as clients from "@/lib/data/clients";

const clientSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactName: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  type: z.enum(["PROJECT", "RECURRING"]),
  status: z.enum(["ACTIVE", "PAUSED", "CHURNED"]),
  rate: z.coerce.number().min(0),
  workType: z.enum([
    "CUSTOM_SOFTWARE",
    "WEB_APP",
    "MOBILE_APP",
    "INTERNAL_TOOL",
    "WEBSITE",
    "INTEGRATION_API",
    "OTHER",
  ]).optional(),
  workTypeOther: z.string().optional(),
  startDate: z.string().optional(),
});

function parseClientForm(formData: FormData) {
  const parsed = clientSchema.parse({
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName") || undefined,
    contactEmail: formData.get("contactEmail") || undefined,
    contactPhone: formData.get("contactPhone") || undefined,
    type: formData.get("type"),
    status: formData.get("status"),
    rate: formData.get("rate") || 0,
    workType: formData.get("workType") || undefined,
    workTypeOther: formData.get("workTypeOther") || undefined,
    startDate: formData.get("startDate") || undefined,
  });
  return {
    ...parsed,
    contactName: parsed.contactName ?? null,
    contactEmail: parsed.contactEmail ?? null,
    contactPhone: parsed.contactPhone ?? null,
    workType: parsed.workType ?? null,
    workTypeOther: parsed.workType === "OTHER" ? parsed.workTypeOther ?? null : null,
    startDate: parsed.startDate ?? null,
  };
}

export async function createClient(formData: FormData) {
  const input = parseClientForm(formData);
  const client = await clients.createClient(input);

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
  label: z.string().min(1, "Label is required"),
  amount: z.coerce.number().min(0),
  status: z.enum(["NOT_INVOICED", "INVOICED", "PAID"]),
  invoicedDate: z.string().optional(),
  paidDate: z.string().optional(),
});

function parseInvoiceForm(formData: FormData) {
  const parsed = invoiceSchema.parse({
    label: formData.get("label"),
    amount: formData.get("amount"),
    status: formData.get("status"),
    invoicedDate: formData.get("invoicedDate") || undefined,
    paidDate: formData.get("paidDate") || undefined,
  });
  return {
    label: parsed.label,
    amount: parsed.amount,
    status: parsed.status,
    invoicedDate: parsed.invoicedDate ?? null,
    paidDate: parsed.paidDate ?? null,
  };
}

export async function addInvoice(clientId: string, formData: FormData) {
  const input = parseInvoiceForm(formData);
  await clients.addInvoice(clientId, input);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
}

export async function updateInvoice(clientId: string, invoiceId: string, formData: FormData) {
  const input = parseInvoiceForm(formData);
  await clients.updateInvoice(invoiceId, input);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
}

export async function deleteInvoice(clientId: string, invoiceId: string) {
  await clients.deleteInvoice(invoiceId);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
}
