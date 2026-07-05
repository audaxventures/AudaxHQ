"use server";

import { revalidatePath } from "next/cache";
import * as profile from "@/lib/data/profile";
import * as businessEntities from "@/lib/data/businessEntities";
import * as appSettings from "@/lib/data/appSettings";
import * as workTypes from "@/lib/data/workTypes";
import * as leadSources from "@/lib/data/leadSources";
import * as todoTypes from "@/lib/data/todoTypes";
import { isCorrectPasscode, hashPasscode } from "@/lib/auth";

function revalidateWorkTypes() {
  revalidatePath("/settings/work-types");
  revalidatePath("/clients");
  revalidatePath("/leads");
}

function revalidateLeadSources() {
  revalidatePath("/settings/lead-sources");
  revalidatePath("/leads");
}

function revalidateTodoTypes() {
  revalidatePath("/settings/todo-types");
  revalidatePath("/todos");
}

export async function createWorkType(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await workTypes.createWorkType(name);
  revalidateWorkTypes();
}

export async function updateWorkType(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await workTypes.updateWorkType(id, name);
  revalidateWorkTypes();
}

export async function activateWorkType(id: string) {
  await workTypes.setWorkTypeActive(id, true);
  revalidateWorkTypes();
}

export async function deactivateWorkType(id: string) {
  await workTypes.setWorkTypeActive(id, false);
  revalidateWorkTypes();
}

export async function createLeadSource(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await leadSources.createLeadSource(name);
  revalidateLeadSources();
}

export async function updateLeadSource(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await leadSources.updateLeadSource(id, name);
  revalidateLeadSources();
}

export async function activateLeadSource(id: string) {
  await leadSources.setLeadSourceActive(id, true);
  revalidateLeadSources();
}

export async function deactivateLeadSource(id: string) {
  await leadSources.setLeadSourceActive(id, false);
  revalidateLeadSources();
}

export async function createTodoType(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await todoTypes.createTodoType(name);
  revalidateTodoTypes();
}

export async function updateTodoType(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await todoTypes.updateTodoType(id, name);
  revalidateTodoTypes();
}

export async function activateTodoType(id: string) {
  await todoTypes.setTodoTypeActive(id, true);
  revalidateTodoTypes();
}

export async function deactivateTodoType(id: string) {
  await todoTypes.setTodoTypeActive(id, false);
  revalidateTodoTypes();
}

export async function updateProfile(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  await profile.updateProfile({ name, email });
  revalidatePath("/settings/profile");
}

export async function createBusinessEntity(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const address = String(formData.get("address") ?? "").trim() || null;
  const contactInfo = String(formData.get("contactInfo") ?? "").trim() || null;
  await businessEntities.createBusinessEntity({ name, address, contactInfo });
  revalidatePath("/settings/business");
}

export async function updateBusinessEntity(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const address = String(formData.get("address") ?? "").trim() || null;
  const contactInfo = String(formData.get("contactInfo") ?? "").trim() || null;
  await businessEntities.updateBusinessEntity(id, { name, address, contactInfo });
  revalidatePath("/settings/business");
}

export async function activateBusinessEntity(id: string) {
  await businessEntities.setBusinessEntityActive(id, true);
  revalidatePath("/settings/business");
}

export async function deactivateBusinessEntity(id: string) {
  await businessEntities.setBusinessEntityActive(id, false);
  revalidatePath("/settings/business");
}

export interface ActionResult {
  error: string | null;
}

export async function updateInvoiceAgingThresholds(formData: FormData): Promise<ActionResult> {
  const underDays = Number(formData.get("underDays"));
  const overDays = Number(formData.get("overDays"));
  if (!(underDays > 0) || !(overDays > underDays)) {
    return { error: "The 'over' threshold must be greater than the 'under' threshold, and both must be positive." };
  }
  await appSettings.updateInvoiceAgingThresholds(underDays, overDays);
  revalidatePath("/settings/invoice-aging");
  revalidatePath("/invoices");
  revalidatePath("/");
  return { error: null };
}

export async function changePasscode(formData: FormData): Promise<ActionResult> {
  const currentPasscode = String(formData.get("currentPasscode") ?? "");
  const newPasscode = String(formData.get("newPasscode") ?? "");
  const confirmPasscode = String(formData.get("confirmPasscode") ?? "");

  if (!(await isCorrectPasscode(currentPasscode))) {
    return { error: "Current passcode is incorrect." };
  }
  if (newPasscode.length < 4) {
    return { error: "New passcode must be at least 4 characters." };
  }
  if (newPasscode !== confirmPasscode) {
    return { error: "New passcode and confirmation don't match." };
  }

  const { hash, salt } = hashPasscode(newPasscode);
  await appSettings.setPasscodeCredentials(hash, salt);
  revalidatePath("/settings/passcode");
  return { error: null };
}
