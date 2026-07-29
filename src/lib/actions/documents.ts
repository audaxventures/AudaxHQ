"use server";

import { revalidatePath } from "next/cache";
import * as documents from "@/lib/data/documents";
import { supabase, DOCUMENTS_BUCKET, LEAD_DOCUMENTS_BUCKET } from "@/lib/storage";
import { MAX_DOCUMENT_SIZE_BYTES, getFileExtension, isAllowedDocumentExtension } from "@/lib/documents";
import { requireClientAccess, requireLeadAccess, requirePartnerAccess, requireCurrentUser } from "@/lib/currentUser";

type Owner = { clientId: string } | { leadId: string } | { partnerId: string };

// Partner documents share the lead bucket rather than getting a dedicated
// one — same private/signed-URL model, and paths are already namespaced by
// businessId/ownerId (see newDocumentStoragePath) so there's no collision
// risk in co-mingling them.
function bucketFor(owner: Owner): string {
  return "clientId" in owner ? DOCUMENTS_BUCKET : LEAD_DOCUMENTS_BUCKET;
}

function ownerId(owner: Owner): string {
  if ("clientId" in owner) return owner.clientId;
  if ("leadId" in owner) return owner.leadId;
  return owner.partnerId;
}

function revalidateOwner(owner: Owner) {
  if ("clientId" in owner) revalidatePath(`/clients/${owner.clientId}`);
  else if ("leadId" in owner) revalidatePath(`/leads/${owner.leadId}`);
  else revalidatePath(`/partners/${owner.partnerId}`);
}

async function requireOwnerAccess(owner: Owner) {
  if ("clientId" in owner) return requireClientAccess(owner.clientId);
  if ("leadId" in owner) return requireLeadAccess(owner.leadId);
  return requirePartnerAccess(owner.partnerId);
}

export async function uploadDocument(owner: Owner, formData: FormData) {
  const user = await requireOwnerAccess(owner);
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
  const filePath = documents.newDocumentStoragePath(user.businessId, ownerId(owner), file.name);

  const { error } = await supabase.storage
    .from(bucketFor(owner))
    .upload(filePath, file, { contentType: file.type || undefined });
  if (error) throw new Error(error.message);

  await documents.createDocument(owner, user.businessId, {
    fileName: file.name,
    filePath,
    fileType: getFileExtension(file.name),
    fileSize: file.size,
    label,
  });
  revalidateOwner(owner);
}

export async function deleteDocument(owner: Owner, documentId: string) {
  const user = await requireOwnerAccess(owner);
  const doc = await documents.getDocument(documentId, user.businessId);
  if (!doc) return;
  await supabase.storage.from(bucketFor(owner)).remove([doc.filePath]);
  await documents.deleteDocumentRecord(documentId, user.businessId);
  revalidateOwner(owner);
}

export async function getDocumentDownloadUrl(documentId: string): Promise<string> {
  const user = await requireCurrentUser();
  const doc = await documents.getDocument(documentId, user.businessId);
  if (!doc) throw new Error("Document not found.");
  if (doc.clientId) await requireClientAccess(doc.clientId);
  else if (doc.leadId) await requireLeadAccess(doc.leadId);
  else if (doc.partnerId) await requirePartnerAccess(doc.partnerId);
  const bucket = doc.clientId ? DOCUMENTS_BUCKET : LEAD_DOCUMENTS_BUCKET;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(doc.filePath, 60, { download: doc.fileName });
  if (error || !data) throw new Error(error?.message ?? "Could not create a download link.");
  return data.signedUrl;
}
