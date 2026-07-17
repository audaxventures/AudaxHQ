"use server";

import { revalidatePath } from "next/cache";
import * as followups from "@/lib/data/followups";
import * as notifications from "@/lib/data/notifications";
import { requireClientAccess, requireLeadAccess } from "@/lib/currentUser";
import { resolveAssignedTeamMemberId, selfId, actorDisplayName } from "@/lib/assign";
import type { CurrentUser, FollowUpStatus } from "@/lib/types";

/** Fires an in-app notification when a follow-up is handed to someone else — mirrors notifyTaskAssignee in actions/tasks.ts. */
async function notifyFollowUpAssignee(
  user: CurrentUser,
  businessId: string,
  assignedToTeamMemberId: string | null,
  previousAssignee: string | null | undefined,
  label: string,
  owner: { clientId?: string; leadId?: string }
) {
  const self = selfId(user);
  if (assignedToTeamMemberId === self || assignedToTeamMemberId === previousAssignee) return;
  await notifications.createNotification(
    businessId,
    assignedToTeamMemberId,
    "FOLLOW_UP_ASSIGNED",
    `${actorDisplayName(user)} assigned you a follow-up: "${label}"`,
    owner.clientId ? `/clients/${owner.clientId}` : `/leads/${owner.leadId}`
  );
}

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

export async function addFollowUp(
  owner: { clientId: string } | { leadId: string },
  formData: FormData
) {
  const user = await resolveOwnerAccess(owner);
  const label = String(formData.get("label") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  if (!label || !date) return;
  const raw = formData.get("assignedTo");
  const assignedToTeamMemberId = resolveAssignedTeamMemberId(raw === null ? null : String(raw), user);
  await followups.addFollowUp(owner, user.businessId, { label, date, assignedToTeamMemberId });
  const ownerIds = { clientId: "clientId" in owner ? owner.clientId : undefined, leadId: "leadId" in owner ? owner.leadId : undefined };
  await notifyFollowUpAssignee(user, user.businessId, assignedToTeamMemberId, undefined, label, ownerIds);
  revalidateOwner(ownerIds.clientId, ownerIds.leadId);
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
  rawAssignedTo: string,
  owner: { clientId?: string; leadId?: string }
) {
  const user = await resolveOwnerAccess(owner);
  const assignedToTeamMemberId = resolveAssignedTeamMemberId(rawAssignedTo, user);
  const existing = await followups.getFollowUpForNotification(id, user.businessId);
  await followups.setFollowUpAssignee(id, user.businessId, assignedToTeamMemberId);
  if (existing) {
    await notifyFollowUpAssignee(user, user.businessId, assignedToTeamMemberId, existing.assignedToTeamMemberId, existing.label, owner);
  }
  revalidateOwner(owner.clientId, owner.leadId);
}

export async function deleteFollowUp(id: string, owner: { clientId?: string; leadId?: string }) {
  const user = await resolveOwnerAccess(owner);
  await followups.deleteFollowUp(id, user.businessId);
  revalidateOwner(owner.clientId, owner.leadId);
}
