import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabase, DOCUMENTS_BUCKET } from "@/lib/storage";

/**
 * Keeps the free-tier Supabase project from being auto-paused for
 * inactivity (Supabase pauses free projects after ~7 days without
 * activity). Supabase here only backs file Storage — the main database is
 * Neon — so on a quiet week nothing else touches it.
 *
 * Hit once a day by .github/workflows/supabase-keepalive.yml. Listing a
 * bucket goes through Supabase's API gateway and queries the project's
 * Postgres (storage.objects), so it counts as real activity. Reuses
 * DAILY_BRIEF_CRON_SECRET so no new secret needs setting up.
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get("authorization");
  if (secret !== `Bearer ${process.env.DAILY_BRIEF_CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).list("", { limit: 1 });
  if (error) {
    console.error("Supabase keep-alive failed:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, checkedAt: new Date().toISOString() });
}
