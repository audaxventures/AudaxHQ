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
