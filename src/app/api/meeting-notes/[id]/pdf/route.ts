import { NextResponse } from "next/server";
import { getMeetingNoteById } from "@/lib/data/meetingnotes";
import { accessibleClientIdsFor } from "@/lib/data/clientAccess";
import { getCurrentUser } from "@/lib/currentUser";
import { renderMeetingNotePdf } from "@/lib/pdf/meetingNotePdf";
import { meetingNotePdfFilename } from "@/lib/pdf/filename";

// GET /api/meeting-notes/:id/pdf — the branded PDF backing both the modal's
// "Download PDF" button and the emailed attachment (src/lib/actions/meetingnotes.ts
// generates the same buffer server-side for the email, so the two are always identical).
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Not authorized", { status: 403 });

  const { id } = await params;
  const accessibleClientIds = await accessibleClientIdsFor(user);
  const note = await getMeetingNoteById(id, user.businessId, { accessibleClientIds });
  if (!note) return new NextResponse("Not found", { status: 404 });

  const pdf = await renderMeetingNotePdf(note, { name: user.business.name, logoUrl: user.business.logoUrl });
  const filename = meetingNotePdfFilename(note);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
    },
  });
}
