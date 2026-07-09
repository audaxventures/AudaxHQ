"use server";

import { revalidatePath } from "next/cache";
import * as businesses from "@/lib/data/businesses";
import * as clientAccess from "@/lib/data/clientAccess";
import * as costEntries from "@/lib/data/costEntries";
import * as followups from "@/lib/data/followups";
import * as teamMembers from "@/lib/data/teamMembers";
import * as todos from "@/lib/data/todos";
import * as workCategories from "@/lib/data/workCategories";
import { getCurrentUser, requireOwner } from "@/lib/currentUser";
import type { FixedCostCategory } from "@/lib/types";

function revalidateOwner(clientId: string | null, leadId: string | null) {
  revalidatePath("/tracker");
  if (clientId) revalidatePath(`/clients/${clientId}`);
  if (leadId) revalidatePath(`/leads/${leadId}`);
}

/** The Add Entry form's owner select encodes its value as "client:<id>" or "lead:<id>". */
function parseOwner(raw: string): { clientId: string | null; leadId: string | null } {
  const [type, id] = raw.split(":");
  if (!id) throw new Error("Choose a client or lead.");
  return { clientId: type === "client" ? id : null, leadId: type === "lead" ? id : null };
}

export async function createTimeEntry(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authorized.");

  const { clientId, leadId } = parseOwner(String(formData.get("owner") ?? ""));
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const date = String(formData.get("date") ?? "");
  const hours = Number(formData.get("hours"));
  const billable = formData.get("billable") === "on";
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!date || !(hours > 0)) {
    throw new Error("Fill in date and hours.");
  }

  let teamMemberId: string;
  let rate: number;

  if (user.role === "OWNER") {
    teamMemberId = String(formData.get("teamMemberId") ?? "");
    rate = Number(formData.get("rate"));
    if (!teamMemberId || !(rate >= 0)) {
      throw new Error("Fill in team member and rate.");
    }
  } else {
    // Team members can only log their own hours, at their own rate — both are
    // pinned server-side rather than trusted from the form, which also keeps
    // the rate ($) figure out of their hands entirely.
    teamMemberId = user.teamMember.id;
    rate = Number(user.teamMember.defaultHourlyRate);
    if (clientId) {
      const accessibleIds = await clientAccess.getClientAccessIds(teamMemberId, user.businessId);
      if (!accessibleIds.includes(clientId)) {
        throw new Error("You don't have access to that client.");
      }
    }
  }

  await costEntries.createTimeEntry(user.businessId, { clientId, leadId, teamMemberId, categoryId, date, hours, rate, billable, description });
  revalidateOwner(clientId, leadId);
}

export async function updateTimeEntry(id: string, previousClientId: string | null, previousLeadId: string | null, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authorized.");

  const { clientId, leadId } = parseOwner(String(formData.get("owner") ?? ""));
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const date = String(formData.get("date") ?? "");
  const hours = Number(formData.get("hours"));
  const billable = formData.get("billable") === "on";
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!date || !(hours > 0)) {
    throw new Error("Fill in date and hours.");
  }

  let teamMemberId: string;
  let rate: number;
  let restrictToTeamMemberId: string | null = null;

  if (user.role === "OWNER") {
    teamMemberId = String(formData.get("teamMemberId") ?? "");
    rate = Number(formData.get("rate"));
    if (!teamMemberId || !(rate >= 0)) {
      throw new Error("Fill in team member and rate.");
    }
  } else {
    // Team members can only edit their own entries, at their own rate — both
    // are pinned server-side rather than trusted from the form.
    teamMemberId = user.teamMember.id;
    rate = Number(user.teamMember.defaultHourlyRate);
    restrictToTeamMemberId = user.teamMember.id;
    if (clientId) {
      const accessibleIds = await clientAccess.getClientAccessIds(teamMemberId, user.businessId);
      if (!accessibleIds.includes(clientId)) {
        throw new Error("You don't have access to that client.");
      }
    }
  }

  await costEntries.updateTimeEntry(
    id,
    user.businessId,
    { clientId, leadId, teamMemberId, categoryId, date, hours, rate, billable, description },
    restrictToTeamMemberId
  );
  revalidateOwner(previousClientId, previousLeadId);
  revalidateOwner(clientId, leadId);
}

export async function deleteTimeEntry(id: string, clientId: string | null, leadId: string | null) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authorized.");
  await costEntries.deleteTimeEntry(id, user.businessId, user.role === "TEAM_MEMBER" ? user.teamMember.id : null);
  revalidateOwner(clientId, leadId);
}

export async function createFixedCost(formData: FormData) {
  const user = await requireOwner();
  const { clientId, leadId } = parseOwner(String(formData.get("owner") ?? ""));
  const date = String(formData.get("date") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const category = (String(formData.get("category") ?? "") || null) as FixedCostCategory | null;

  if (!date || !description || !(amount >= 0)) {
    throw new Error("Fill in date, description, and amount.");
  }

  await costEntries.createFixedCost(user.businessId, { clientId, leadId, date, description, amount, category });
  revalidateOwner(clientId, leadId);
}

export async function updateFixedCost(
  id: string,
  previousClientId: string | null,
  previousLeadId: string | null,
  formData: FormData
) {
  const user = await requireOwner();
  const { clientId, leadId } = parseOwner(String(formData.get("owner") ?? ""));
  const date = String(formData.get("date") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const category = (String(formData.get("category") ?? "") || null) as FixedCostCategory | null;

  if (!date || !description || !(amount >= 0)) {
    throw new Error("Fill in date, description, and amount.");
  }

  await costEntries.updateFixedCost(id, user.businessId, { clientId, leadId, date, description, amount, category });
  revalidateOwner(previousClientId, previousLeadId);
  revalidateOwner(clientId, leadId);
}

export async function deleteFixedCost(id: string, clientId: string | null, leadId: string | null) {
  const user = await requireOwner();
  await costEntries.deleteFixedCost(id, user.businessId);
  revalidateOwner(clientId, leadId);
}

function revalidateTeamMembers() {
  revalidatePath("/tracker");
  revalidatePath("/settings/team-members");
}

function revalidateWorkCategories() {
  revalidatePath("/tracker");
  revalidatePath("/settings/work-categories");
}

export async function createTeamMember(formData: FormData) {
  const user = await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  const defaultHourlyRate = Number(formData.get("defaultHourlyRate") ?? 0);
  if (!name) return;
  await teamMembers.createTeamMember(user.businessId, { name, defaultHourlyRate });
  revalidateTeamMembers();
}

export async function updateTeamMember(id: string, formData: FormData) {
  const user = await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  const defaultHourlyRate = Number(formData.get("defaultHourlyRate") ?? 0);
  if (!name) return;
  await teamMembers.updateTeamMember(id, user.businessId, { name, defaultHourlyRate });
  revalidateTeamMembers();
}

export async function activateTeamMember(id: string) {
  const user = await requireOwner();
  await teamMembers.setTeamMemberActive(id, user.businessId, true);
  revalidateTeamMembers();
}

export async function deactivateTeamMember(id: string) {
  const user = await requireOwner();
  await teamMembers.setTeamMemberActive(id, user.businessId, false);
  revalidateTeamMembers();
}

export async function deleteTeamMemberPermanently(id: string) {
  const user = await requireOwner();
  if (id === user.business.ownerTeamMemberId) {
    throw new Error("This row is linked to your own owner login — unlink it before deleting.");
  }
  const member = await teamMembers.getTeamMember(id, user.businessId);
  if (!member) return;
  if (member.active) {
    throw new Error("Deactivate this team member before permanently deleting them.");
  }
  const timeEntryCount = await teamMembers.countTimeEntries(id, user.businessId);
  if (timeEntryCount > 0) {
    throw new Error(
      `${member.name} has ${timeEntryCount} logged time ${timeEntryCount === 1 ? "entry" : "entries"} and can't be permanently deleted — that would remove them from your cost history. Keep them deactivated instead.`
    );
  }
  await teamMembers.deleteTeamMemberPermanently(id, user.businessId);
  revalidateTeamMembers();
}

export async function enableTeamMemberLogin(id: string, formData: FormData) {
  const user = await requireOwner();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const passcode = String(formData.get("passcode") ?? "");
  if (!email || passcode.length < 4) {
    throw new Error("Enter an email and a passcode of at least 4 characters.");
  }
  await teamMembers.setTeamMemberLogin(id, user.businessId, email, passcode);
  revalidateTeamMembers();
}

export async function disableTeamMemberLogin(id: string) {
  const user = await requireOwner();
  await teamMembers.removeTeamMemberLogin(id, user.businessId);
  revalidateTeamMembers();
}

export async function resetTeamMemberPasscode(id: string, formData: FormData) {
  await requireOwner();
  const passcode = String(formData.get("passcode") ?? "");
  if (passcode.length < 4) {
    throw new Error("Passcode must be at least 4 characters.");
  }
  await teamMembers.setTeamMemberPasscode(id, passcode);
  revalidateTeamMembers();
}

export async function updateClientAccess(teamMemberId: string, formData: FormData) {
  const user = await requireOwner();
  const clientIds = formData.getAll("clientId").map((v) => String(v));
  await clientAccess.setClientAccess(teamMemberId, user.businessId, clientIds);
  revalidateTeamMembers();
}

/**
 * Links a team_members row (e.g. one the owner created to track their own
 * billable hours) as the owner's own identity, so assigning a to-do/follow-up
 * to that row is treated identically to assigning it to the owner. Also
 * repairs anything already stuck on that row from before the link existed.
 */
export async function linkOwnerTeamMember(teamMemberId: string) {
  const user = await requireOwner();
  await businesses.setOwnerTeamMember(user.businessId, teamMemberId);
  await todos.reassignTasksFromTeamMemberToOwner(user.businessId, teamMemberId);
  await followups.reassignFollowUpsFromTeamMemberToOwner(user.businessId, teamMemberId);
  revalidateTeamMembers();
  revalidatePath("/todos");
  revalidatePath("/");
}

export async function unlinkOwnerTeamMember() {
  const user = await requireOwner();
  await businesses.setOwnerTeamMember(user.businessId, null);
  revalidateTeamMembers();
  revalidatePath("/todos");
  revalidatePath("/");
}

export async function createWorkCategory(formData: FormData) {
  const user = await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  const defaultHourlyRate = Number(formData.get("defaultHourlyRate") ?? 0);
  if (!name) return;
  await workCategories.createWorkCategory(user.businessId, { name, defaultHourlyRate });
  revalidateWorkCategories();
}

export async function updateWorkCategory(id: string, formData: FormData) {
  const user = await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  const defaultHourlyRate = Number(formData.get("defaultHourlyRate") ?? 0);
  if (!name) return;
  await workCategories.updateWorkCategory(id, user.businessId, { name, defaultHourlyRate });
  revalidateWorkCategories();
}

export async function activateWorkCategory(id: string) {
  const user = await requireOwner();
  await workCategories.setWorkCategoryActive(id, user.businessId, true);
  revalidateWorkCategories();
}

export async function deactivateWorkCategory(id: string) {
  const user = await requireOwner();
  await workCategories.setWorkCategoryActive(id, user.businessId, false);
  revalidateWorkCategories();
}
