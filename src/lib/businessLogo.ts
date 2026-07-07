// File-type/size rules for the business logo upload. Dependency-free (no
// db/storage imports) so it can be shared by both the server action and
// the client-side upload form.

import { getFileExtension } from "@/lib/documents";

export const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_LOGO_EXTENSIONS = ["png", "jpg", "jpeg", "svg", "webp"];

export function isAllowedLogoExtension(fileName: string): boolean {
  return ALLOWED_LOGO_EXTENSIONS.includes(getFileExtension(fileName));
}

/** Namespaced by business, with a timestamped filename so replacing the logo naturally busts any cached copy of the old public URL. */
export function newLogoStoragePath(businessId: string, fileName: string): string {
  const ext = getFileExtension(fileName) || "png";
  return `${businessId}/logo-${Date.now()}.${ext}`;
}
