"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as meetingNotes from "@/lib/data/meetingnotes";
import { requireClientAccess, requireLeadAccess } from "@/lib/currentUser";
import { sanitizeRichText, isRichTextEmpty } from "@/lib/richtext";
import type { CurrentUser } from "@/lib/types";

function revalidateOwner(clientId?: string | null, leadId?: string | null) {
  revalidatePath("/meeting-notes");
  if (clientId) revalidatePath(`/clients/${clientId}`);
  if (leadId) revalidatePath(`/leads/${leadId}`);
}

/** Resolves + authorizes the owning client/lead, whichever is set. */
async function resolveOwnerAccess(owner: { clientId?: string | null; leadId?: string | null }): Promise<CurrentUser> {
  if (owner.clientId) return requireClientAccess(owner.clientId);
  if (owner.leadId) return requireLeadAccess(owner.leadId);
  throw new Error("Not authorized.");
}

/** Extracts and sanitizes the three rich-text fields, so an agenda can be saved on its own before the meeting happens. Returns null if all three are empty. */
function extractRichTextFields(formData: FormData): { agenda: string | null; notes: string | null; actionItems: string | null } | null {
  const agenda = sanitizeRichText(String(formData.get("agenda") ?? ""));
  const notes = sanitizeRichText(String(formData.get("notes") ?? ""));
  const actionItems = sanitizeRichText(String(formData.get("actionItems") ?? ""));
  if (isRichTextEmpty(agenda) && isRichTextEmpty(notes) && isRichTextEmpty(actionItems)) return null;
  return {
    agenda: isRichTextEmpty(agenda) ? null : agenda,
    notes: isRichTextEmpty(notes) ? null : notes,
    actionItems: isRichTextEmpty(actionItems) ? null : actionItems,
  };
}

export async function createMeetingNote(formData: FormData) {
  const clientId = (formData.get("clientId") as string) || undefined;
  const leadId = (formData.get("leadId") as string) || undefined;
  const meetingDate = String(formData.get("meetingDate") ?? "");
  const attendees = (formData.get("attendees") as string) || null;
  const fields = extractRichTextFields(formData);
  if ((!clientId && !leadId) || !meetingDate || !fields) return;
  const user = await resolveOwnerAccess({ clientId, leadId });

  await meetingNotes.createMeetingNote(user.businessId, { clientId, leadId, meetingDate, attendees, ...fields });
  revalidateOwner(clientId, leadId);
  redirect(clientId ? `/clients/${clientId}` : `/leads/${leadId}`);
}

export async function createScopedMeetingNote(
  owner: { type: "CLIENT"; clientId: string } | { type: "LEAD"; leadId: string },
  formData: FormData
) {
  const user =
    owner.type === "CLIENT" ? await requireClientAccess(owner.clientId) : await requireLeadAccess(owner.leadId);
  const meetingDate = String(formData.get("meetingDate") ?? "");
  const attendees = (formData.get("attendees") as string) || null;
  const fields = extractRichTextFields(formData);
  if (!meetingDate || !fields) return;

  await meetingNotes.createMeetingNote(user.businessId, {
    clientId: owner.type === "CLIENT" ? owner.clientId : undefined,
    leadId: owner.type === "LEAD" ? owner.leadId : undefined,
    meetingDate,
    attendees,
    ...fields,
  });
  revalidateOwner(
    owner.type === "CLIENT" ? owner.clientId : undefined,
    owner.type === "LEAD" ? owner.leadId : undefined
  );
}

export async function updateMeetingNote(
  id: string,
  owner: { clientId?: string | null; leadId?: string | null },
  formData: FormData
) {
  const user = await resolveOwnerAccess(owner);
  const meetingDate = String(formData.get("meetingDate") ?? "");
  const attendees = (formData.get("attendees") as string) || null;
  const fields = extractRichTextFields(formData);
  if (!meetingDate || !fields) return;

  await meetingNotes.updateMeetingNote(id, user.businessId, { meetingDate, attendees, ...fields });
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
