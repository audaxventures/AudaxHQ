"use server";

import { revalidatePath } from "next/cache";
import * as clientAccess from "@/lib/data/clientAccess";
import * as costEntries from "@/lib/data/costEntries";
import * as teamMembers from "@/lib/data/teamMembers";
import * as workCategories from "@/lib/data/workCategories";
import { requireOwner } from "@/lib/currentUser";
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
  const { clientId, leadId } = parseOwner(String(formData.get("owner") ?? ""));
  const teamMemberId = String(formData.get("teamMemberId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const date = String(formData.get("date") ?? "");
  const hours = Number(formData.get("hours"));
  const rate = Number(formData.get("rate"));
  const billable = formData.get("billable") === "on";
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!teamMemberId || !date || !(hours > 0) || !(rate >= 0)) {
    throw new Error("Fill in team member, date, and hours.");
  }

  await costEntries.createTimeEntry({ clientId, leadId, teamMemberId, categoryId, date, hours, rate, billable, description });
  revalidateOwner(clientId, leadId);
}

export async function deleteTimeEntry(id: string, clientId: string | null, leadId: string | null) {
  await costEntries.deleteTimeEntry(id);
  revalidateOwner(clientId, leadId);
}

export async function createFixedCost(formData: FormData) {
  const { clientId, leadId } = parseOwner(String(formData.get("owner") ?? ""));
  const date = String(formData.get("date") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const category = (String(formData.get("category") ?? "") || null) as FixedCostCategory | null;

  if (!date || !description || !(amount >= 0)) {
    throw new Error("Fill in date, description, and amount.");
  }

  await costEntries.createFixedCost({ clientId, leadId, date, description, amount, category });
  revalidateOwner(clientId, leadId);
}

export async function deleteFixedCost(id: string, clientId: string | null, leadId: string | null) {
  await costEntries.deleteFixedCost(id);
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
  await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  const defaultHourlyRate = Number(formData.get("defaultHourlyRate") ?? 0);
  if (!name) return;
  await teamMembers.createTeamMember({ name, defaultHourlyRate });
  revalidateTeamMembers();
}

export async function updateTeamMember(id: string, formData: FormData) {
  await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  const defaultHourlyRate = Number(formData.get("defaultHourlyRate") ?? 0);
  if (!name) return;
  await teamMembers.updateTeamMember(id, { name, defaultHourlyRate });
  revalidateTeamMembers();
}

export async function activateTeamMember(id: string) {
  await requireOwner();
  await teamMembers.setTeamMemberActive(id, true);
  revalidateTeamMembers();
}

export async function deactivateTeamMember(id: string) {
  await requireOwner();
  await teamMembers.setTeamMemberActive(id, false);
  revalidateTeamMembers();
}

export async function enableTeamMemberLogin(id: string, formData: FormData) {
  await requireOwner();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const passcode = String(formData.get("passcode") ?? "");
  if (!email || passcode.length < 4) {
    throw new Error("Enter an email and a passcode of at least 4 characters.");
  }
  await teamMembers.setTeamMemberLogin(id, email, passcode);
  revalidateTeamMembers();
}

export async function disableTeamMemberLogin(id: string) {
  await requireOwner();
  await teamMembers.removeTeamMemberLogin(id);
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
  await requireOwner();
  const clientIds = formData.getAll("clientId").map((v) => String(v));
  await clientAccess.setClientAccess(teamMemberId, clientIds);
  revalidateTeamMembers();
}

export async function createWorkCategory(formData: FormData) {
  await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  const defaultHourlyRate = Number(formData.get("defaultHourlyRate") ?? 0);
  if (!name) return;
  await workCategories.createWorkCategory({ name, defaultHourlyRate });
  revalidateWorkCategories();
}

export async function updateWorkCategory(id: string, formData: FormData) {
  await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  const defaultHourlyRate = Number(formData.get("defaultHourlyRate") ?? 0);
  if (!name) return;
  await workCategories.updateWorkCategory(id, { name, defaultHourlyRate });
  revalidateWorkCategories();
}

export async function activateWorkCategory(id: string) {
  await requireOwner();
  await workCategories.setWorkCategoryActive(id, true);
  revalidateWorkCategories();
}

export async function deactivateWorkCategory(id: string) {
  await requireOwner();
  await workCategories.setWorkCategoryActive(id, false);
  revalidateWorkCategories();
}
