import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. Add them to your environment (see .env.example)."
  );
}

export const DOCUMENTS_BUCKET = "client-documents";
/** Same private/signed-URL model as DOCUMENTS_BUCKET, just a separate bucket so client and lead files never mix. */
export const LEAD_DOCUMENTS_BUCKET = "lead-documents";
/** Public bucket (unlike the two above) — the business logo is rendered directly via its public URL on every page load, no signed URL needed. */
export const BUSINESS_ASSETS_BUCKET = "business-assets";

// Server-only: the service_role key bypasses row-level security, so this
// client must never be imported into client components. Both document
// buckets are private — every download goes through a signed URL minted
// on request (see getDocumentDownloadUrl in lib/actions/documents.ts),
// never a public link.
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

/**
 * Every object under `prefix`, recursing into subfolders. Supabase Storage's
 * list() isn't recursive and represents a subfolder as an entry with
 * `id: null` (files always have a real id) — document paths are nested one
 * level deeper (businessId/ownerId/file) than the logo path (businessId/file),
 * so this has to walk down rather than assume a fixed depth.
 */
async function listAllFilePaths(bucket: string, prefix: string): Promise<string[]> {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error || !data) return [];
  const paths: string[] = [];
  for (const entry of data) {
    const fullPath = `${prefix}/${entry.name}`;
    if (entry.id === null) {
      paths.push(...(await listAllFilePaths(bucket, fullPath)));
    } else {
      paths.push(fullPath);
    }
  }
  return paths;
}

/**
 * Removes every file a business has ever uploaded — logo plus client/lead
 * documents — across all three buckets. Used only when permanently deleting
 * a workspace; every object in these buckets is namespaced under
 * `${businessId}/...` (see newDocumentStoragePath/newLogoStoragePath), so a
 * single prefix walk per bucket covers all of it.
 */
export async function deleteAllBusinessFiles(businessId: string): Promise<void> {
  for (const bucket of [DOCUMENTS_BUCKET, LEAD_DOCUMENTS_BUCKET, BUSINESS_ASSETS_BUCKET]) {
    const paths = await listAllFilePaths(bucket, businessId);
    if (paths.length > 0) {
      await supabase.storage.from(bucket).remove(paths);
    }
  }
}
