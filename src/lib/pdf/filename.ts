import { formatDate } from "@/lib/format";
import type { MeetingNote } from "@/lib/types";

// Split out from meetingNotePdf.tsx (which pulls in `fs` and @react-pdf/renderer's
// server-only render path) so client components — MeetingNoteEmailDrawer.tsx's
// attachment-name preview — can import just this without dragging that into the
// browser bundle.

/** Filename for both the download route's Content-Disposition and the emailed attachment — kept in one place so the two never drift. */
export function meetingNotePdfFilename(note: MeetingNote): string {
  const datePart = formatDate(note.meetingDate).replace(/,/g, "");
  const titlePart = (note.title ?? "Meeting Notes").replace(/[^a-zA-Z0-9 ]/g, "").trim() || "Meeting Notes";
  return `${titlePart} - ${datePart}.pdf`;
}
