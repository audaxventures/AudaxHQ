"use server";

import { revalidatePath } from "next/cache";
import * as documents from "@/lib/data/documents";
import { supabase, DOCUMENTS_BUCKET, LEAD_DOCUMENTS_BUCKET } from "@/lib/storage";
import { MAX_DOCUMENT_SIZE_BYTES, getFileExtension, isAllowedDocumentExtension } from "@/lib/documents";
import { requireClientAccess } from "@/lib/currentUser";

type Owner = { clientId: string } | { leadId: string };

function bucketFor(owner: Owner): string {
  return "clientId" in owner ? DOCUMENTS_BUCKET : LEAD_DOCUMENTS_BUCKET;
}

function ownerId(owner: Owner): string {
  return "clientId" in owner ? owner.clientId : owner.leadId;
}

function revalidateOwner(owner: Owner) {
  if ("clientId" in owner) revalidatePath(`/clients/${owner.clientId}`);
  else revalidatePath(`/leads/${owner.leadId}`);
}

export async function uploadDocument(owner: Owner, formData: FormData) {
  if ("clientId" in owner) await requireClientAccess(owner.clientId);
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
  const filePath = documents.newDocumentStoragePath(ownerId(owner), file.name);

  const { error } = await supabase.storage
    .from(bucketFor(owner))
    .upload(filePath, file, { contentType: file.type || undefined });
  if (error) throw new Error(error.message);

  await documents.createDocument(owner, {
    fileName: file.name,
    filePath,
    fileType: getFileExtension(file.name),
    fileSize: file.size,
    label,
  });
  revalidateOwner(owner);
}

export async function deleteDocument(owner: Owner, documentId: string) {
  if ("clientId" in owner) await requireClientAccess(owner.clientId);
  const doc = await documents.getDocument(documentId);
  if (!doc) return;
  await supabase.storage.from(bucketFor(owner)).remove([doc.filePath]);
  await documents.deleteDocumentRecord(documentId);
  revalidateOwner(owner);
}

export async function getDocumentDownloadUrl(documentId: string): Promise<string> {
  const doc = await documents.getDocument(documentId);
  if (!doc) throw new Error("Document not found.");
  if (doc.clientId) await requireClientAccess(doc.clientId);
  const bucket = doc.clientId ? DOCUMENTS_BUCKET : LEAD_DOCUMENTS_BUCKET;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(doc.filePath, 60, { download: doc.fileName });
  if (error || !data) throw new Error(error?.message ?? "Could not create a download link.");
  return data.signedUrl;
}
