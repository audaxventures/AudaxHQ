import { randomUUID } from "crypto";
import { sql } from "@/lib/db";
import type { Document } from "@/lib/types";

// Single-user app — no real uploader identity to track yet, but the column
// is kept so a future multi-user version doesn't need a schema change.
const DEFAULT_UPLOADED_BY = "Joshua";

function mapDocument(row: Record<string, unknown>): Document {
  return {
    id: row.id as string,
    clientId: row.client_id as string | null,
    leadId: row.lead_id as string | null,
    fileName: row.file_name as string,
    filePath: row.file_path as string,
    fileType: row.file_type as string,
    fileSize: Number(row.file_size),
    label: row.label as string | null,
    uploadedBy: row.uploaded_by as string,
    createdAt: row.created_at as string,
  };
}

export async function listDocumentsForClient(clientId: string): Promise<Document[]> {
  const rows = await sql`
    select * from documents where client_id = ${clientId} order by created_at desc
  `;
  return rows.map((r) => mapDocument(r as Record<string, unknown>));
}

export async function listDocumentsForLead(leadId: string): Promise<Document[]> {
  const rows = await sql`
    select * from documents where lead_id = ${leadId} order by created_at desc
  `;
  return rows.map((r) => mapDocument(r as Record<string, unknown>));
}

export async function getDocument(id: string): Promise<Document | null> {
  const rows = await sql`select * from documents where id = ${id}`;
  return rows.length > 0 ? mapDocument(rows[0] as Record<string, unknown>) : null;
}

export interface DocumentInput {
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  label: string | null;
}

export async function createDocument(
  owner: { clientId: string } | { leadId: string },
  input: DocumentInput
): Promise<Document> {
  const clientId = "clientId" in owner ? owner.clientId : null;
  const leadId = "leadId" in owner ? owner.leadId : null;
  const rows = await sql`
    insert into documents (client_id, lead_id, file_name, file_path, file_type, file_size, label, uploaded_by)
    values (
      ${clientId}, ${leadId}, ${input.fileName}, ${input.filePath}, ${input.fileType},
      ${input.fileSize}, ${input.label}, ${DEFAULT_UPLOADED_BY}
    )
    returning *
  `;
  return mapDocument(rows[0] as Record<string, unknown>);
}

export async function deleteDocumentRecord(id: string): Promise<void> {
  await sql`delete from documents where id = ${id}`;
}

// Namespaced by owner so a bucket listing groups by client/lead, and given a
// random prefix so two uploads of the same filename never collide.
export function newDocumentStoragePath(ownerId: string, fileName: string): string {
  return `${ownerId}/${randomUUID()}-${fileName}`;
}
