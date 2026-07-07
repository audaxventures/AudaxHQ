"use server";

import { revalidatePath } from "next/cache";
import * as followups from "@/lib/data/followups";
import { requireClientAccess } from "@/lib/currentUser";
import type { FollowUpStatus } from "@/lib/types";

function revalidateOwner(clientId?: string, leadId?: string) {
  if (clientId) revalidatePath(`/clients/${clientId}`);
  if (leadId) revalidatePath(`/leads/${leadId}`);
  revalidatePath("/");
}

export async function addFollowUp(
  owner: { clientId: string } | { leadId: string },
  formData: FormData
) {
  if ("clientId" in owner) await requireClientAccess(owner.clientId);
  const label = String(formData.get("label") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  if (!label || !date) return;
  const assignedToTeamMemberId = String(formData.get("assignedTo") ?? "") || null;
  await followups.addFollowUp(owner, { label, date, assignedToTeamMemberId });
  revalidateOwner("clientId" in owner ? owner.clientId : undefined, "leadId" in owner ? owner.leadId : undefined);
}

export async function setFollowUpStatus(
  id: string,
  status: FollowUpStatus,
  owner: { clientId?: string; leadId?: string }
) {
  if (owner.clientId) await requireClientAccess(owner.clientId);
  await followups.setFollowUpStatus(id, status);
  revalidateOwner(owner.clientId, owner.leadId);
}

export async function setFollowUpAssignee(
  id: string,
  assignedToTeamMemberId: string | null,
  owner: { clientId?: string; leadId?: string }
) {
  if (owner.clientId) await requireClientAccess(owner.clientId);
  await followups.setFollowUpAssignee(id, assignedToTeamMemberId);
  revalidateOwner(owner.clientId, owner.leadId);
}

export async function deleteFollowUp(id: string, owner: { clientId?: string; leadId?: string }) {
  if (owner.clientId) await requireClientAccess(owner.clientId);
  await followups.deleteFollowUp(id);
  revalidateOwner(owner.clientId, owner.leadId);
}
