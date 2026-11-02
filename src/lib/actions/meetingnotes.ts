"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as meetingNotes from "@/lib/data/meetingnotes";
import * as todos from "@/lib/data/todos";
import * as todoTypes from "@/lib/data/todoTypes";
import { requireClientAccess, requireLeadAccess, requirePartnerAccess, requireCurrentUser } from "@/lib/currentUser";
import { sanitizeRichText, isRichTextEmpty } from "@/lib/richtext";
import { sendMeetingNotePdfEmail } from "@/lib/email";
import { renderMeetingNotePdf } from "@/lib/pdf/meetingNotePdf";
import { meetingNotePdfFilename } from "@/lib/pdf/filename";
import { FOLDER_COLORS } from "@/components/meetingnotes/noteColors";
import type { CurrentUser, EntityColor, MeetingNote, TaskOwner } from "@/lib/types";

function revalidateOwner(clientId?: string | null, leadId?: string | null, partnerId?: string | null) {
  revalidatePath("/meeting-notes");
  // Action items quick-added here land on the to-do board and dashboard too.
  revalidatePath("/todos");
  revalidatePath("/");
  if (clientId) revalidatePath(`/clients/${clientId}`);
  if (leadId) revalidatePath(`/leads/${leadId}`);
  if (partnerId) revalidatePath(`/partners/${partnerId}`);
}

/** Resolves + authorizes the owning client/lead/partner, whichever is set. */
async function resolveOwnerAccess(owner: {
  clientId?: string | null;
  leadId?: string | null;
  partnerId?: string | null;
}): Promise<CurrentUser> {
  if (owner.clientId) return requireClientAccess(owner.clientId);
  if (owner.leadId) return requireLeadAccess(owner.leadId);
  if (owner.partnerId) return requirePartnerAccess(owner.partnerId);
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

/** Start time / timezone / duration / location — see migrations 029 and 036. All optional, shared by every create/update/schedule entry point. */
function extractSchedulingFields(formData: FormData): {
  startTime: string | null;
  timezone: string | null;
  durationMinutes: number | null;
  location: string | null;
} {
  const startTime = (formData.get("startTime") as string) || null;
  const timezone = (formData.get("timezone") as string) || null;
  const durationRaw = Number(formData.get("durationMinutes"));
  const location = (formData.get("location") as string)?.trim() || null;
  return {
    startTime,
    timezone,
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

type NoteOwner = { clientId?: string | null; leadId?: string | null; partnerId?: string | null };

/**
 * Turns each quick-added action item into a real to-do, linked back to the
 * meeting note and the same client/lead/partner it belongs to. A private
 * note has no client/lead/partner, so its action items become custom-category
 * to-dos (todoTypeId, picked on the form) and are always the team's own —
 * there's no "them" on a private note.
 */
async function createActionItemTasks(
  businessId: string,
  meetingNoteId: string,
  owner: NoteOwner,
  items: QueuedActionItem[],
  createdByTeamMemberId: string | null,
  todoTypeId: string | null = null
): Promise<void> {
  if (items.length === 0) return;
  const isPrivate = !owner.clientId && !owner.leadId && !owner.partnerId;
  const type = owner.clientId ? "CLIENT" : owner.leadId ? "LEAD" : owner.partnerId ? "PARTNER" : "CUSTOM";
  for (const item of items) {
    await todos.createActionItemTask(
      businessId,
      {
        title: item.text,
        dueDate: item.dueDate,
        type,
        todoTypeId: isPrivate ? todoTypeId : null,
        clientId: owner.clientId ?? null,
        leadId: owner.leadId ?? null,
        partnerId: owner.partnerId ?? null,
        meetingNoteId,
        ownedBy: isPrivate ? "TEAM" : item.ownedBy,
      },
      createdByTeamMemberId
    );
  }
}

/** Private-note action items need an active to-do category of this workspace — checked before anything is written. */
async function assertActionItemCategory(businessId: string, todoTypeId: string | null): Promise<void> {
  const activeTypes = await todoTypes.listTodoTypes(businessId);
  if (!todoTypeId || !activeTypes.some((t) => t.id === todoTypeId)) {
    throw new Error("Pick a to-do category for this note's action items.");
  }
}

/**
 * Folder + tags from the form — each only when its field was actually on
 * the form (undefined otherwise), so forms without them (e.g. the drawer on
 * a client page) never wipe someone's filing.
 */
function extractOrganizing(formData: FormData): { folderId: string | null | undefined; tags: string[] | undefined } {
  return {
    folderId: formData.has("folderId") ? (formData.get("folderId") as string) || null : undefined,
    tags: formData.has("tags")
      ? String(formData.get("tags") ?? "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined,
  };
}

type Organizing = ReturnType<typeof extractOrganizing>;

/**
 * Reads folder + tags off the form and checks the folder before anything
 * is written: it must be one of the signed-in person's own, and it can't be
 * a folder that has subfolders (those are for sorting only) — unless the
 * note is already in it, from before its first subfolder was added.
 */
async function resolveOrganizing(user: CurrentUser, formData: FormData, currentFolderId: string | null = null): Promise<Organizing> {
  const org = extractOrganizing(formData);
  if (org.folderId) {
    const folders = await meetingNotes.listNoteFolders(user.businessId, selfId(user));
    const folder = folders.find((f) => f.id === org.folderId);
    if (!folder) throw new Error("That folder doesn't exist.");
    if (org.folderId !== currentFolderId && folders.some((f) => f.parentId === folder.id)) {
      throw new Error(`"${folder.name}" has subfolders — pick one of them instead.`);
    }
  }
  return org;
}

/** Folders and tags are personal, so this files/tags the note for whoever is signed in only. */
async function applyOrganizing(user: CurrentUser, noteId: string, org: Organizing): Promise<void> {
  const me = selfId(user);
  if (org.folderId !== undefined) {
    await meetingNotes.setNoteFolder(noteId, user.businessId, me, org.folderId);
  }
  if (org.tags !== undefined) {
    await meetingNotes.setNoteTags(noteId, user.businessId, me, org.tags);
  }
}

function selfId(user: CurrentUser): string | null {
  return user.role === "TEAM_MEMBER" ? user.teamMember.id : null;
}

/**
 * The Notes page's "New note" form. ownerType PRIVATE (the default) makes a
 * note with no client/lead — visible only to whoever wrote it, and without
 * an agenda (private notes are about the notes themselves).
 */
export async function createMeetingNote(formData: FormData) {
  const ownerType = String(formData.get("ownerType") ?? "PRIVATE");
  const clientId = ownerType === "CLIENT" ? (formData.get("clientId") as string) || undefined : undefined;
  const leadId = ownerType === "LEAD" ? (formData.get("leadId") as string) || undefined : undefined;
  const isPrivate = ownerType === "PRIVATE";
  const title = (formData.get("title") as string)?.trim() || null;
  const meetingDate = String(formData.get("meetingDate") ?? "");
  const attendees = (formData.get("attendees") as string) || null;
  const fields = extractRichTextFields(formData);
  const actionItems = parseActionItems(formData);
  if (!isPrivate && !clientId && !leadId) return;
  if (!meetingDate) return;
  if (!fields && actionItems.length === 0 && !(isPrivate && title)) return;

  const user = isPrivate ? await requireCurrentUser() : await resolveOwnerAccess({ clientId, leadId });
  const scheduling = extractSchedulingFields(formData);
  const todoTypeId = (formData.get("actionItemTodoTypeId") as string) || null;
  if (isPrivate && actionItems.length > 0) await assertActionItemCategory(user.businessId, todoTypeId);
  const organizing = await resolveOrganizing(user, formData);

  const noteId = await meetingNotes.createMeetingNote(user.businessId, {
    title,
    clientId,
    leadId,
    meetingDate,
    ...scheduling,
    attendees,
    agenda: isPrivate ? null : (fields?.agenda ?? null),
    notes: fields?.notes ?? null,
    authorTeamMemberId: isPrivate ? selfId(user) : null,
  });
  await createActionItemTasks(user.businessId, noteId, { clientId, leadId }, actionItems, selfId(user), todoTypeId);
  await applyOrganizing(user, noteId, organizing);
  revalidateOwner(clientId, leadId);
  if (clientId) redirect(`/clients/${clientId}`);
  if (leadId) redirect(`/leads/${leadId}`);
  redirect(organizing.folderId ? `/meeting-notes?folder=${organizing.folderId}` : "/meeting-notes?view=private");
}

type ScopedOwner = { type: "CLIENT"; clientId: string } | { type: "LEAD"; leadId: string } | { type: "PARTNER"; partnerId: string };

async function requireScopedOwnerAccess(owner: ScopedOwner): Promise<CurrentUser> {
  if (owner.type === "CLIENT") return requireClientAccess(owner.clientId);
  if (owner.type === "LEAD") return requireLeadAccess(owner.leadId);
  return requirePartnerAccess(owner.partnerId);
}

export async function createScopedMeetingNote(owner: ScopedOwner, formData: FormData) {
  const user = await requireScopedOwnerAccess(owner);
  const title = (formData.get("title") as string)?.trim() || null;
  const meetingDate = String(formData.get("meetingDate") ?? "");
  const attendees = (formData.get("attendees") as string) || null;
  const fields = extractRichTextFields(formData);
  const actionItems = parseActionItems(formData);
  if (!meetingDate || (!fields && actionItems.length === 0)) return;

  const clientId = owner.type === "CLIENT" ? owner.clientId : undefined;
  const leadId = owner.type === "LEAD" ? owner.leadId : undefined;
  const partnerId = owner.type === "PARTNER" ? owner.partnerId : undefined;
  const scheduling = extractSchedulingFields(formData);

  const noteId = await meetingNotes.createMeetingNote(user.businessId, {
    title,
    clientId,
    leadId,
    partnerId,
    meetingDate,
    ...scheduling,
    attendees,
    agenda: fields?.agenda ?? null,
    notes: fields?.notes ?? null,
  });
  await createActionItemTasks(user.businessId, noteId, { clientId, leadId, partnerId }, actionItems, selfId(user));
  revalidateOwner(clientId, leadId, partnerId);
}

/**
 * Fast-path scheduling: just a date/time/duration/location, no agenda/notes/
 * action items required — that's the whole point (booking a slot shouldn't
 * demand a full write-up). The same underlying record can be opened later
 * via the full edit modal to add notes once the meeting has happened.
 */
export async function scheduleMeeting(owner: ScopedOwner, formData: FormData) {
  const user = await requireScopedOwnerAccess(owner);
  const meetingDate = String(formData.get("meetingDate") ?? "");
  if (!meetingDate) return;

  const clientId = owner.type === "CLIENT" ? owner.clientId : undefined;
  const leadId = owner.type === "LEAD" ? owner.leadId : undefined;
  const partnerId = owner.type === "PARTNER" ? owner.partnerId : undefined;
  const title = (formData.get("title") as string)?.trim() || null;
  const scheduling = extractSchedulingFields(formData);

  await meetingNotes.createMeetingNote(user.businessId, {
    title,
    clientId,
    leadId,
    partnerId,
    meetingDate,
    ...scheduling,
  });
  revalidateOwner(clientId, leadId, partnerId);
}

/**
 * Looks the note up as the signed-in person sees it — the note's real
 * client/lead/partner (and, for a private note, its author) come from the
 * database, never from the caller, so nobody can edit a note they can't see.
 */
async function requireVisibleNote(id: string): Promise<{ user: CurrentUser; note: MeetingNote }> {
  const user = await requireCurrentUser();
  const note = await meetingNotes.getMeetingNoteById(id, user.businessId, await meetingNotes.noteViewerFor(user));
  if (!note) throw new Error("Note not found.");
  return { user, note };
}

export async function updateMeetingNote(id: string, formData: FormData) {
  const { user, note } = await requireVisibleNote(id);
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
  const todoTypeId = (formData.get("actionItemTodoTypeId") as string) || null;
  if (note.isPrivate && actionItems.length > 0) await assertActionItemCategory(user.businessId, todoTypeId);
  const organizing = await resolveOrganizing(user, formData, note.folderId ?? null);

  await meetingNotes.updateMeetingNote(id, user.businessId, {
    title,
    meetingDate,
    ...scheduling,
    attendees,
    // Private notes have no agenda field on the form — keep whatever is stored.
    agenda: formData.has("agenda") ? (fields?.agenda ?? null) : note.agenda,
    notes: fields?.notes ?? null,
  });
  const owner = { clientId: note.clientId, leadId: note.leadId, partnerId: note.partnerId };
  await createActionItemTasks(user.businessId, id, owner, actionItems, selfId(user), todoTypeId);
  await applyOrganizing(user, id, organizing);
  revalidateOwner(note.clientId, note.leadId, note.partnerId);
}

export async function deleteMeetingNote(id: string) {
  const { user, note } = await requireVisibleNote(id);
  await meetingNotes.deleteMeetingNote(id, user.businessId);
  revalidateOwner(note.clientId, note.leadId, note.partnerId);
}

// ---------------------------------------------------------------------------
// Folders — personal to whoever is signed in. One level of subfolders.
// ---------------------------------------------------------------------------

export async function createNoteFolder(name: string, parentId: string | null): Promise<string | null> {
  const user = await requireCurrentUser();
  const trimmed = name.trim().slice(0, 80);
  if (!trimmed) return null;
  const me = selfId(user);
  if (parentId) {
    const parent = await meetingNotes.getNoteFolder(parentId, user.businessId, me);
    if (!parent) throw new Error("That folder doesn't exist.");
    if (parent.parentId) throw new Error("Folders can only be nested one level deep.");
  }
  const id = await meetingNotes.createNoteFolder(user.businessId, me, trimmed, parentId);
  revalidatePath("/meeting-notes");
  return id;
}

export async function renameNoteFolder(id: string, name: string) {
  const user = await requireCurrentUser();
  const trimmed = name.trim().slice(0, 80);
  if (!trimmed) return;
  await meetingNotes.renameNoteFolder(id, user.businessId, selfId(user), trimmed);
  revalidatePath("/meeting-notes");
}

export async function setNoteFolderColor(id: string, color: EntityColor | null) {
  const user = await requireCurrentUser();
  if (color !== null && !FOLDER_COLORS.includes(color)) throw new Error("That colour isn't available for folders.");
  await meetingNotes.setNoteFolderColor(id, user.businessId, selfId(user), color);
  revalidatePath("/meeting-notes");
}

export async function deleteNoteFolder(id: string) {
  const user = await requireCurrentUser();
  await meetingNotes.deleteNoteFolder(id, user.businessId, selfId(user));
  revalidatePath("/meeting-notes");
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
  const note = await meetingNotes.getMeetingNoteById(noteId, user.businessId, await meetingNotes.noteViewerFor(user));
  if (!note) {
    return { success: false, error: "Meeting note not found." };
  }
  if (note.isPrivate) {
    return { success: false, error: "Private notes can't be emailed out." };
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
  revalidateOwner(note.clientId, note.leadId, note.partnerId);
  return { success: true, error: null };
}
