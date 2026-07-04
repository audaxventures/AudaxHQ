// File-type/size rules for client document uploads. Kept dependency-free
// (no db/storage imports) so it can be shared by both the server actions
// and the client-side upload form.

export const MAX_DOCUMENT_SIZE_BYTES = 25 * 1024 * 1024;

export const ALLOWED_DOCUMENT_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "csv",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
];

export function getFileExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  return idx === -1 ? "" : fileName.slice(idx + 1).toLowerCase();
}

export function isAllowedDocumentExtension(fileName: string): boolean {
  return ALLOWED_DOCUMENT_EXTENSIONS.includes(getFileExtension(fileName));
}
