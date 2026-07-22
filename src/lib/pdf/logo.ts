import { promises as fs } from "fs";
import path from "path";

/**
 * Fetches the business's uploaded logo into a Buffer for embedding, falling
 * back to the bundled default logo on any failure (missing logoUrl, a dead
 * Supabase Storage URL, a network hiccup) — a PDF export should never fail
 * outright just because the logo couldn't be fetched. Shared by every PDF
 * generator (meeting notes, invoice reports) so they never drift.
 */
export async function loadLogoBuffer(logoUrl: string | null): Promise<Buffer | null> {
  if (logoUrl) {
    try {
      const res = await fetch(logoUrl);
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    } catch {
      // fall through to the bundled default below
    }
  }
  try {
    return await fs.readFile(path.join(process.cwd(), "public", "logo.png"));
  } catch {
    return null;
  }
}
