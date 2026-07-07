"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as meetingNotes from "@/lib/data/meetingnotes";
import { requireClientAccess } from "@/lib/currentUser";

function revalidateOwner(clientId?: string | null, leadId?: string | null) {
  revalidatePath("/meeting-notes");
  if (clientId) revalidatePath(`/clients/${clientId}`);
  if (leadId) revalidatePath(`/leads/${leadId}`);
}

export async function createMeetingNote(formData: FormData) {
  const clientId = (formData.get("clientId") as string) || undefined;
  const leadId = (formData.get("leadId") as string) || undefined;
  const meetingDate = String(formData.get("meetingDate") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const attendees = (formData.get("attendees") as string) || null;
  if ((!clientId && !leadId) || !meetingDate || !notes) return;
  if (clientId) await requireClientAccess(clientId);

  await meetingNotes.createMeetingNote({ clientId, leadId, meetingDate, attendees, notes });
  revalidateOwner(clientId, leadId);
  redirect(clientId ? `/clients/${clientId}` : `/leads/${leadId}`);
}

export async function createScopedMeetingNote(
  owner: { type: "CLIENT"; clientId: string } | { type: "LEAD"; leadId: string },
  formData: FormData
) {
  if (owner.type === "CLIENT") await requireClientAccess(owner.clientId);
  const meetingDate = String(formData.get("meetingDate") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const attendees = (formData.get("attendees") as string) || null;
  if (!meetingDate || !notes) return;

  await meetingNotes.createMeetingNote({
    clientId: owner.type === "CLIENT" ? owner.clientId : undefined,
    leadId: owner.type === "LEAD" ? owner.leadId : undefined,
    meetingDate,
    attendees,
    notes,
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
  if (owner.clientId) await requireClientAccess(owner.clientId);
  const meetingDate = String(formData.get("meetingDate") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const attendees = (formData.get("attendees") as string) || null;
  if (!meetingDate || !notes) return;

  await meetingNotes.updateMeetingNote(id, { meetingDate, attendees, notes });
  revalidateOwner(owner.clientId, owner.leadId);
}

export async function deleteMeetingNote(
  id: string,
  owner: { clientId?: string | null; leadId?: string | null }
) {
  if (owner.clientId) await requireClientAccess(owner.clientId);
  await meetingNotes.deleteMeetingNote(id);
  revalidateOwner(owner.clientId, owner.leadId);
}
