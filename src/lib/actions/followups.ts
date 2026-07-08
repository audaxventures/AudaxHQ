"use server";

import { revalidatePath } from "next/cache";
import * as followups from "@/lib/data/followups";
import { requireClientAccess, requireLeadAccess } from "@/lib/currentUser";
import type { CurrentUser, FollowUpStatus } from "@/lib/types";

function revalidateOwner(clientId?: string, leadId?: string) {
  if (clientId) revalidatePath(`/clients/${clientId}`);
  if (leadId) revalidatePath(`/leads/${leadId}`);
  revalidatePath("/");
}

/** Resolves + authorizes the owning client/lead, whichever is set. */
async function resolveOwnerAccess(owner: { clientId?: string; leadId?: string }): Promise<CurrentUser> {
  if (owner.clientId) return requireClientAccess(owner.clientId);
  if (owner.leadId) return requireLeadAccess(owner.leadId);
  throw new Error("Not authorized.");
}

/** See resolveAssignee in lib/actions/tasks.ts — same normalization, for follow-ups. */
function normalizeAssignee(assignedToTeamMemberId: string | null, user: CurrentUser): string | null {
  if (assignedToTeamMemberId === user.business.ownerTeamMemberId) return null;
  return assignedToTeamMemberId;
}

export async function addFollowUp(
  owner: { clientId: string } | { leadId: string },
  formData: FormData
) {
  const user = await resolveOwnerAccess(owner);
  const label = String(formData.get("label") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  if (!label || !date) return;
  const assignedToTeamMemberId = normalizeAssignee(String(formData.get("assignedTo") ?? "") || null, user);
  await followups.addFollowUp(owner, user.businessId, { label, date, assignedToTeamMemberId });
  revalidateOwner("clientId" in owner ? owner.clientId : undefined, "leadId" in owner ? owner.leadId : undefined);
}

export async function setFollowUpStatus(
  id: string,
  status: FollowUpStatus,
  owner: { clientId?: string; leadId?: string }
) {
  const user = await resolveOwnerAccess(owner);
  await followups.setFollowUpStatus(id, user.businessId, status);
  revalidateOwner(owner.clientId, owner.leadId);
}

export async function setFollowUpAssignee(
  id: string,
  assignedToTeamMemberId: string | null,
  owner: { clientId?: string; leadId?: string }
) {
  const user = await resolveOwnerAccess(owner);
  await followups.setFollowUpAssignee(id, user.businessId, normalizeAssignee(assignedToTeamMemberId, user));
  revalidateOwner(owner.clientId, owner.leadId);
}

export async function deleteFollowUp(id: string, owner: { clientId?: string; leadId?: string }) {
  const user = await resolveOwnerAccess(owner);
  await followups.deleteFollowUp(id, user.businessId);
  revalidateOwner(owner.clientId, owner.leadId);
}
