"use server";

import { revalidatePath } from "next/cache";
import * as followups from "@/lib/data/followups";
import * as notifications from "@/lib/data/notifications";
import { requireClientAccess, requireLeadAccess, requirePartnerAccess, requireProspectAccess } from "@/lib/currentUser";
import { resolveAssignedTeamMemberId, selfId, actorDisplayName } from "@/lib/assign";
import type { CurrentUser, FollowUpStatus } from "@/lib/types";

/** Fires an in-app notification when a follow-up is handed to someone else — mirrors notifyTaskAssignee in actions/tasks.ts. */
async function notifyFollowUpAssignee(
  user: CurrentUser,
  businessId: string,
  assignedToTeamMemberId: string | null,
  previousAssignee: string | null | undefined,
  label: string,
  owner: { clientId?: string; leadId?: string; partnerId?: string; prospectId?: string }
) {
  const self = selfId(user);
  if (assignedToTeamMemberId === self || assignedToTeamMemberId === previousAssignee) return;
  const link = owner.clientId
    ? `/clients/${owner.clientId}`
    : owner.leadId
      ? `/leads/${owner.leadId}`
      : owner.partnerId
        ? `/partners/${owner.partnerId}`
        // Prospects have no detail page — the list page reads this and
        // auto-opens the drawer for that prospect (see ?open= handling on
        // /prospects).
        : `/prospects?open=${owner.prospectId}`;
  await notifications.createNotification(
    businessId,
    assignedToTeamMemberId,
    "FOLLOW_UP_ASSIGNED",
    `${actorDisplayName(user)} assigned you a follow-up: "${label}"`,
    link
  );
}

function revalidateOwner(clientId?: string, leadId?: string, partnerId?: string, prospectId?: string) {
  if (clientId) revalidatePath(`/clients/${clientId}`);
  if (leadId) revalidatePath(`/leads/${leadId}`);
  if (partnerId) revalidatePath(`/partners/${partnerId}`);
  if (prospectId) revalidatePath("/prospects");
  revalidatePath("/");
}

/** Resolves + authorizes the owning client/lead/partner/prospect, whichever is set. */
async function resolveOwnerAccess(owner: {
  clientId?: string;
  leadId?: string;
  partnerId?: string;
  prospectId?: string;
}): Promise<CurrentUser> {
  if (owner.clientId) return requireClientAccess(owner.clientId);
  if (owner.leadId) return requireLeadAccess(owner.leadId);
  if (owner.partnerId) return requirePartnerAccess(owner.partnerId);
  if (owner.prospectId) return requireProspectAccess(owner.prospectId);
  throw new Error("Not authorized.");
}

export async function addFollowUp(
  owner: { clientId: string } | { leadId: string } | { partnerId: string } | { prospectId: string },
  formData: FormData
) {
  const user = await resolveOwnerAccess(owner);
  const label = String(formData.get("label") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  if (!label || !date) return;
  const raw = formData.get("assignedTo");
  const assignedToTeamMemberId = resolveAssignedTeamMemberId(raw === null ? null : String(raw), user);
  await followups.addFollowUp(owner, user.businessId, { label, date, assignedToTeamMemberId });
  const ownerIds = {
    clientId: "clientId" in owner ? owner.clientId : undefined,
    leadId: "leadId" in owner ? owner.leadId : undefined,
    partnerId: "partnerId" in owner ? owner.partnerId : undefined,
    prospectId: "prospectId" in owner ? owner.prospectId : undefined,
  };
  await notifyFollowUpAssignee(user, user.businessId, assignedToTeamMemberId, undefined, label, ownerIds);
  revalidateOwner(ownerIds.clientId, ownerIds.leadId, ownerIds.partnerId, ownerIds.prospectId);
}

export async function updateFollowUp(
  id: string,
  owner: { clientId?: string; leadId?: string; partnerId?: string; prospectId?: string },
  formData: FormData
) {
  const user = await resolveOwnerAccess(owner);
  const label = String(formData.get("label") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const status = String(formData.get("status") ?? "UPCOMING") as FollowUpStatus;
  const assignedToTeamMemberId = String(formData.get("assignedToTeamMemberId") ?? "") || null;
  if (!label || !date) return;
  await followups.updateFollowUp(id, user.businessId, { label, date, status, assignedToTeamMemberId });
  revalidateOwner(owner.clientId, owner.leadId, owner.partnerId, owner.prospectId);
}

export async function setFollowUpStatus(
  id: string,
  status: FollowUpStatus,
  owner: { clientId?: string; leadId?: string; partnerId?: string; prospectId?: string }
) {
  const user = await resolveOwnerAccess(owner);
  await followups.setFollowUpStatus(id, user.businessId, status);
  revalidateOwner(owner.clientId, owner.leadId, owner.partnerId, owner.prospectId);
}

export async function setFollowUpAssignee(
  id: string,
  rawAssignedTo: string,
  owner: { clientId?: string; leadId?: string; partnerId?: string; prospectId?: string }
) {
  const user = await resolveOwnerAccess(owner);
  const assignedToTeamMemberId = resolveAssignedTeamMemberId(rawAssignedTo, user);
  const existing = await followups.getFollowUpForNotification(id, user.businessId);
  await followups.setFollowUpAssignee(id, user.businessId, assignedToTeamMemberId);
  if (existing) {
    await notifyFollowUpAssignee(user, user.businessId, assignedToTeamMemberId, existing.assignedToTeamMemberId, existing.label, owner);
  }
  revalidateOwner(owner.clientId, owner.leadId, owner.partnerId, owner.prospectId);
}

export async function deleteFollowUp(
  id: string,
  owner: { clientId?: string; leadId?: string; partnerId?: string; prospectId?: string }
) {
  const user = await resolveOwnerAccess(owner);
  await followups.deleteFollowUp(id, user.businessId);
  revalidateOwner(owner.clientId, owner.leadId, owner.partnerId, owner.prospectId);
}
