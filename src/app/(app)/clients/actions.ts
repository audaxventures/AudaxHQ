"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import * as clients from "@/lib/data/clients";
import * as documents from "@/lib/data/documents";
import { getToday } from "@/lib/data/profile";
import { supabase, DOCUMENTS_BUCKET } from "@/lib/storage";
import { MAX_DOCUMENT_SIZE_BYTES, getFileExtension, isAllowedDocumentExtension } from "@/lib/documents";
import { requireClientAccess, requireOwner } from "@/lib/currentUser";
import type { EntityColor } from "@/lib/types";

const clientSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactName: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  type: z.enum(["PROJECT", "RECURRING"]),
  status: z.enum(["ACTIVE", "PAUSED", "CHURNED"]),
  rate: z.coerce.number().min(0),
  workTypeId: z.string().optional(),
  workTypeOther: z.string().optional(),
  startDate: z.string().optional(),
  budgetedHours: z.coerce.number().min(0).optional(),
  color: z.enum(["navy", "slate", "blue", "sage", "burnt", "gold", "brick", "violet"]).optional(),
});

/**
 * `fallbackRate` covers team members editing a client with the rate field
 * hidden (ClientForm's hideRate) — formData.get("rate") is null (never
 * submitted) rather than an empty string, so without a fallback the client's
 * existing rate would silently get zeroed out by an unrelated edit.
 */
function parseClientForm(formData: FormData, fallbackRate = 0) {
  const rate = formData.get("rate");
  const parsed = clientSchema.parse({
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName") || undefined,
    contactEmail: formData.get("contactEmail") || undefined,
    contactPhone: formData.get("contactPhone") || undefined,
    type: formData.get("type"),
    status: formData.get("status"),
    rate: rate !== null ? rate || 0 : fallbackRate,
    workTypeId: formData.get("workTypeId") || undefined,
    // Only ever submitted by the form when the "Other" fallback work type is selected.
    workTypeOther: formData.get("workTypeOther") || undefined,
    startDate: formData.get("startDate") || undefined,
    budgetedHours: formData.get("budgetedHours") || undefined,
    color: formData.get("color") || undefined,
  });
  return {
    ...parsed,
    contactName: parsed.contactName ?? null,
    contactEmail: parsed.contactEmail ?? null,
    contactPhone: parsed.contactPhone ?? null,
    workTypeId: parsed.workTypeId ?? null,
    workTypeOther: parsed.workTypeOther ?? null,
    startDate: parsed.startDate ?? null,
    budgetedHours: parsed.budgetedHours ?? null,
    color: parsed.color ?? null,
  };
}

export async function createClient(formData: FormData) {
  const input = parseClientForm(formData);
  const client = await clients.createClient(input, await getToday());

  revalidatePath("/clients");
  revalidatePath("/");
  redirect(`/clients/${client.id}`);
}

export async function updateClient(id: string, formData: FormData) {
  await requireClientAccess(id);
  const fallbackRate = formData.get("rate") === null ? await clients.getClientRate(id) : 0;
  const input = parseClientForm(formData, fallbackRate);
  await clients.updateClient(id, input, await getToday());
  revalidatePath(`/clients/${id}`);
  revalidatePath("/clients");
  revalidatePath("/");
}

export async function archiveClient(id: string) {
  await requireClientAccess(id);
  await clients.setClientStatus(id, "CHURNED");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/clients");
  revalidatePath("/");
}

export async function activateClient(id: string) {
  await requireClientAccess(id);
  await clients.setClientStatus(id, "ACTIVE");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/clients");
  revalidatePath("/");
}

export async function setClientColor(id: string, color: EntityColor | null) {
  await requireClientAccess(id);
  await clients.setClientColor(id, color);
  revalidatePath(`/clients/${id}`);
  revalidatePath("/clients");
  revalidatePath("/");
}

export async function addClientNote(clientId: string, formData: FormData) {
  await requireClientAccess(clientId);
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  await clients.addClientNote(clientId, body);
  revalidatePath(`/clients/${clientId}`);
}

export async function addClientLink(clientId: string, formData: FormData) {
  await requireClientAccess(clientId);
  const label = String(formData.get("label") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!label || !url) return;
  await clients.addClientLink(clientId, label, url);
  revalidatePath(`/clients/${clientId}`);
}

export async function deleteClientLink(clientId: string, linkId: string) {
  await requireClientAccess(clientId);
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
  await requireOwner();
  const input = parseInvoiceForm(formData);
  await clients.addInvoice(clientId, input);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
}

export async function updateInvoice(clientId: string, invoiceId: string, formData: FormData) {
  await requireOwner();
  const input = parseInvoiceForm(formData);
  await clients.updateInvoice(invoiceId, input);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
}

export async function deleteInvoice(clientId: string, invoiceId: string) {
  await requireOwner();
  await clients.deleteInvoice(invoiceId);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
}

// --- Documents ---

export async function uploadDocument(clientId: string, formData: FormData) {
  await requireClientAccess(clientId);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a file to upload.");
  }
  if (!isAllowedDocumentExtension(file.name)) {
    throw new Error("That file type isn't supported.");
  }
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error("File is too large (25MB max).");
  }
  const label = String(formData.get("label") ?? "").trim() || null;
  const filePath = documents.newDocumentStoragePath(clientId, file.name);

  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(filePath, file, { contentType: file.type || undefined });
  if (error) throw new Error(error.message);

  await documents.createDocument({
    clientId,
    fileName: file.name,
    filePath,
    fileType: getFileExtension(file.name),
    fileSize: file.size,
    label,
  });
  revalidatePath(`/clients/${clientId}`);
}

export async function deleteDocument(clientId: string, documentId: string) {
  await requireClientAccess(clientId);
  const doc = await documents.getDocument(documentId);
  if (!doc) return;
  await supabase.storage.from(DOCUMENTS_BUCKET).remove([doc.filePath]);
  await documents.deleteDocumentRecord(documentId);
  revalidatePath(`/clients/${clientId}`);
}

export async function getDocumentDownloadUrl(documentId: string): Promise<string> {
  const doc = await documents.getDocument(documentId);
  if (!doc) throw new Error("Document not found.");
  await requireClientAccess(doc.clientId);
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(doc.filePath, 60, { download: doc.fileName });
  if (error || !data) throw new Error(error?.message ?? "Could not create a download link.");
  return data.signedUrl;
}
