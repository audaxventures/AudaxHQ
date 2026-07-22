"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as meetingNotes from "@/lib/data/meetingnotes";
import * as todos from "@/lib/data/todos";
import { requireClientAccess, requireLeadAccess, requireCurrentUser } from "@/lib/currentUser";
import { accessibleClientIdsFor } from "@/lib/data/clientAccess";
import { sanitizeRichText, isRichTextEmpty } from "@/lib/richtext";
import { sendMeetingNotePdfEmail } from "@/lib/email";
import { renderMeetingNotePdf } from "@/lib/pdf/meetingNotePdf";
import { meetingNotePdfFilename } from "@/lib/pdf/filename";
import type { CurrentUser, TaskOwner } from "@/lib/types";

function revalidateOwner(clientId?: string | null, leadId?: string | null) {
  revalidatePath("/meeting-notes");
  // Action items quick-added here land on the to-do board and dashboard too.
  revalidatePath("/todos");
  revalidatePath("/");
  if (clientId) revalidatePath(`/clients/${clientId}`);
  if (leadId) revalidatePath(`/leads/${leadId}`);
}

/** Resolves + authorizes the owning client/lead, whichever is set. */
async function resolveOwnerAccess(owner: { clientId?: string | null; leadId?: string | null }): Promise<CurrentUser> {
  if (owner.clientId) return requireClientAccess(owner.clientId);
  if (owner.leadId) return requireLeadAccess(owner.leadId);
  throw new Error("Not authorized.");
}

/** Extracts and sanitizes the two rich-text fields, so an agenda can be saved on its own before the meeting happens. Returns null if both are empty. */
function extractRichTextFields(formData: FormData): { agenda: string | null; notes: string | null } | null {
  const agenda = sanitizeRichText(String(formData.get("agenda") ?? ""));
  const notes = sanitizeRichText(String(formData.get("notes") ?? ""));
  if (isRichTextEmpty(agenda) && isRichTextEmpty(notes)) return null;
  return {
    agenda: isRichTextEmpty(agenda) ? null : agenda,
    notes: isRichTextEmpty(notes) ? null : notes,
  };
}

/** Start time / duration / location — see migration 029. All optional, shared by every create/update/schedule entry point. */
function extractSchedulingFields(formData: FormData): {
  startTime: string | null;
  durationMinutes: number | null;
  location: string | null;
} {
  const startTime = (formData.get("startTime") as string) || null;
  const durationRaw = Number(formData.get("durationMinutes"));
  const location = (formData.get("location") as string)?.trim() || null;
  return {
    startTime,
    durationMinutes: Number.isFinite(durationRaw) && durationRaw > 0 ? durationRaw : null,
    location,
  };
}

interface QueuedActionItem {
  text: string;
  dueDate: string | null;
  ownedBy: TaskOwner;
}

/** Parses the JSON queue posted by ActionItemsQuickAdd. Malformed input just yields no items rather than erroring — this is quick-add UI, not a strict API. */
function parseActionItems(formData: FormData): QueuedActionItem[] {
  const raw = String(formData.get("actionItems") ?? "");
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is { text: unknown; dueDate: unknown; ownedBy: unknown } =>
          typeof item === "object" && item !== null && typeof (item as { text: unknown }).text === "string"
      )
      .map((item) => ({
        text: String(item.text).trim(),
        dueDate: typeof item.dueDate === "string" && item.dueDate ? item.dueDate : null,
        ownedBy: item.ownedBy === "EXTERNAL" ? ("EXTERNAL" as const) : ("TEAM" as const),
      }))
      .filter((item) => item.text.length > 0);
  } catch {
    return [];
  }
}

/** Turns each quick-added action item into a real to-do, linked back to the meeting note and the same client/lead it belongs to. */
async function createActionItemTasks(
  businessId: string,
  meetingNoteId: string,
  owner: { clientId?: string | null; leadId?: string | null },
  items: QueuedActionItem[],
  createdByTeamMemberId: string | null
): Promise<void> {
  for (const item of items) {
    await todos.createActionItemTask(
      businessId,
      {
        title: item.text,
        dueDate: item.dueDate,
        type: owner.clientId ? "CLIENT" : "LEAD",
        clientId: owner.clientId ?? null,
        leadId: owner.leadId ?? null,
        meetingNoteId,
        ownedBy: item.ownedBy,
      },
      createdByTeamMemberId
    );
  }
}

function selfId(user: CurrentUser): string | null {
  return user.role === "TEAM_MEMBER" ? user.teamMember.id : null;
}

export async function createMeetingNote(formData: FormData) {
  const clientId = (formData.get("clientId") as string) || undefined;
  const leadId = (formData.get("leadId") as string) || undefined;
  const title = (formData.get("title") as string)?.trim() || null;
  const meetingDate = String(formData.get("meetingDate") ?? "");
  const attendees = (formData.get("attendees") as string) || null;
  const fields = extractRichTextFields(formData);
  const actionItems = parseActionItems(formData);
  if ((!clientId && !leadId) || !meetingDate || (!fields && actionItems.length === 0)) return;
  const user = await resolveOwnerAccess({ clientId, leadId });
  const scheduling = extractSchedulingFields(formData);

  const noteId = await meetingNotes.createMeetingNote(user.businessId, {
    title,
    clientId,
    leadId,
    meetingDate,
    ...scheduling,
    attendees,
    agenda: fields?.agenda ?? null,
    notes: fields?.notes ?? null,
  });
  await createActionItemTasks(user.businessId, noteId, { clientId, leadId }, actionItems, selfId(user));
  revalidateOwner(clientId, leadId);
  redirect(clientId ? `/clients/${clientId}` : `/leads/${leadId}`);
}

export async function createScopedMeetingNote(
  owner: { type: "CLIENT"; clientId: string } | { type: "LEAD"; leadId: string },
  formData: FormData
) {
  const user =
    owner.type === "CLIENT" ? await requireClientAccess(owner.clientId) : await requireLeadAccess(owner.leadId);
  const title = (formData.get("title") as string)?.trim() || null;
  const meetingDate = String(formData.get("meetingDate") ?? "");
  const attendees = (formData.get("attendees") as string) || null;
  const fields = extractRichTextFields(formData);
  const actionItems = parseActionItems(formData);
  if (!meetingDate || (!fields && actionItems.length === 0)) return;

  const clientId = owner.type === "CLIENT" ? owner.clientId : undefined;
  const leadId = owner.type === "LEAD" ? owner.leadId : undefined;
  const scheduling = extractSchedulingFields(formData);

  const noteId = await meetingNotes.createMeetingNote(user.businessId, {
    title,
    clientId,
    leadId,
    meetingDate,
    ...scheduling,
    attendees,
    agenda: fields?.agenda ?? null,
    notes: fields?.notes ?? null,
  });
  await createActionItemTasks(user.businessId, noteId, { clientId, leadId }, actionItems, selfId(user));
  revalidateOwner(clientId, leadId);
}

/**
 * Fast-path scheduling: just a date/time/duration/location, no agenda/notes/
 * action items required — that's the whole point (booking a slot shouldn't
 * demand a full write-up). The same underlying record can be opened later
 * via the full edit modal to add notes once the meeting has happened.
 */
export async function scheduleMeeting(
  owner: { type: "CLIENT"; clientId: string } | { type: "LEAD"; leadId: string },
  formData: FormData
) {
  const user =
    owner.type === "CLIENT" ? await requireClientAccess(owner.clientId) : await requireLeadAccess(owner.leadId);
  const meetingDate = String(formData.get("meetingDate") ?? "");
  if (!meetingDate) return;

  const clientId = owner.type === "CLIENT" ? owner.clientId : undefined;
  const leadId = owner.type === "LEAD" ? owner.leadId : undefined;
  const title = (formData.get("title") as string)?.trim() || null;
  const scheduling = extractSchedulingFields(formData);

  await meetingNotes.createMeetingNote(user.businessId, {
    title,
    clientId,
    leadId,
    meetingDate,
    ...scheduling,
  });
  revalidateOwner(clientId, leadId);
}

export async function updateMeetingNote(
  id: string,
  owner: { clientId?: string | null; leadId?: string | null },
  formData: FormData
) {
  const user = await resolveOwnerAccess(owner);
  const title = (formData.get("title") as string)?.trim() || null;
  const meetingDate = String(formData.get("meetingDate") ?? "");
  const attendees = (formData.get("attendees") as string) || null;
  const fields = extractRichTextFields(formData);
  const actionItems = parseActionItems(formData);
  // Unlike create, an update is never rejected for being "empty" — the
  // record already exists, and a meeting that's scheduled but hasn't
  // happened yet (no agenda/notes) is a legitimate state to save.
  if (!meetingDate) return;
  const scheduling = extractSchedulingFields(formData);

  await meetingNotes.updateMeetingNote(id, user.businessId, {
    title,
    meetingDate,
    ...scheduling,
    attendees,
    agenda: fields?.agenda ?? null,
    notes: fields?.notes ?? null,
  });
  await createActionItemTasks(user.businessId, id, owner, actionItems, selfId(user));
  revalidateOwner(owner.clientId, owner.leadId);
}

export async function deleteMeetingNote(
  id: string,
  owner: { clientId?: string | null; leadId?: string | null }
) {
  const user = await resolveOwnerAccess(owner);
  await meetingNotes.deleteMeetingNote(id, user.businessId);
  revalidateOwner(owner.clientId, owner.leadId);
}

export interface SendMeetingNoteEmailState {
  success: boolean;
  error: string | null;
}

/** Emails a meeting note's branded PDF to its client/lead contact — see MeetingNoteEmailDrawer.tsx for the compose UI this backs. CC's and reply-tos the sender so they get a copy and replies land in their own inbox. */
export async function sendMeetingNoteEmail(
  _prevState: SendMeetingNoteEmailState,
  formData: FormData
): Promise<SendMeetingNoteEmailState> {
  const noteId = String(formData.get("noteId") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const bodyText = String(formData.get("bodyText") ?? "").trim();
  if (!noteId || !subject || !bodyText) {
    return { success: false, error: "Fill in a subject and message before sending." };
  }

  const user = await requireCurrentUser();
  const accessibleClientIds = await accessibleClientIdsFor(user);
  const note = await meetingNotes.getMeetingNoteById(noteId, user.businessId, { accessibleClientIds });
  if (!note) {
    return { success: false, error: "Meeting note not found." };
  }
  if (!note.ownerEmail) {
    return { success: false, error: "This client/lead doesn't have an email on file yet." };
  }

  const senderName = user.role === "OWNER" ? user.business.ownerName : user.teamMember.name;
  const senderEmail = user.role === "OWNER" ? user.business.ownerEmail : user.teamMember.email;

  try {
    const pdf = await renderMeetingNotePdf(note, { name: user.business.name, logoUrl: user.business.logoUrl });
    await sendMeetingNotePdfEmail({
      to: note.ownerEmail,
      cc: senderEmail,
      replyTo: senderEmail,
      senderName,
      businessName: user.business.name,
      subject,
      bodyText,
      attachmentFilename: meetingNotePdfFilename(note),
      attachmentBase64: pdf.toString("base64"),
    });
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Couldn't send the email. Try again later." };
  }

  await meetingNotes.recordMeetingNoteEmailSent(noteId, user.businessId, note.ownerEmail);
  revalidateOwner(note.clientId, note.leadId);
  return { success: true, error: null };
}
