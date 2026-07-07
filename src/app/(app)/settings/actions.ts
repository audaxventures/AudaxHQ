"use server";

import { revalidatePath } from "next/cache";
import * as profile from "@/lib/data/profile";
import * as businessEntities from "@/lib/data/businessEntities";
import * as appSettings from "@/lib/data/appSettings";
import * as workTypes from "@/lib/data/workTypes";
import * as leadSources from "@/lib/data/leadSources";
import * as todoTypes from "@/lib/data/todoTypes";
import { isCorrectPasscode, hashPasscode } from "@/lib/auth";
import { requireOwner } from "@/lib/currentUser";
import { supabase, BUSINESS_ASSETS_BUCKET } from "@/lib/storage";
import { MAX_LOGO_SIZE_BYTES, isAllowedLogoExtension, newLogoStoragePath } from "@/lib/businessLogo";

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
  await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await workTypes.createWorkType(name);
  revalidateWorkTypes();
}

export async function updateWorkType(id: string, formData: FormData) {
  await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await workTypes.updateWorkType(id, name);
  revalidateWorkTypes();
}

export async function activateWorkType(id: string) {
  await requireOwner();
  await workTypes.setWorkTypeActive(id, true);
  revalidateWorkTypes();
}

export async function deactivateWorkType(id: string) {
  await requireOwner();
  await workTypes.setWorkTypeActive(id, false);
  revalidateWorkTypes();
}

export async function createLeadSource(formData: FormData) {
  await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await leadSources.createLeadSource(name);
  revalidateLeadSources();
}

export async function updateLeadSource(id: string, formData: FormData) {
  await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await leadSources.updateLeadSource(id, name);
  revalidateLeadSources();
}

export async function activateLeadSource(id: string) {
  await requireOwner();
  await leadSources.setLeadSourceActive(id, true);
  revalidateLeadSources();
}

export async function deactivateLeadSource(id: string) {
  await requireOwner();
  await leadSources.setLeadSourceActive(id, false);
  revalidateLeadSources();
}

export async function createTodoType(formData: FormData) {
  await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await todoTypes.createTodoType(name);
  revalidateTodoTypes();
}

export async function updateTodoType(id: string, formData: FormData) {
  await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await todoTypes.updateTodoType(id, name);
  revalidateTodoTypes();
}

export async function activateTodoType(id: string) {
  await requireOwner();
  await todoTypes.setTodoTypeActive(id, true);
  revalidateTodoTypes();
}

export async function deactivateTodoType(id: string) {
  await requireOwner();
  await todoTypes.setTodoTypeActive(id, false);
  revalidateTodoTypes();
}

export async function updateProfile(formData: FormData) {
  await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "").trim() || "UTC";
  await profile.updateProfile({ name, email, timezone });
  // Timezone changes what "today" is computed as almost everywhere in the
  // app, not just this settings page — revalidate the whole (app) section.
  revalidatePath("/", "layout");
}

export async function uploadBusinessLogo(formData: FormData) {
  await requireOwner();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a logo file to upload.");
  }
  if (!isAllowedLogoExtension(file.name)) {
    throw new Error("That file type isn't supported.");
  }
  if (file.size > MAX_LOGO_SIZE_BYTES) {
    throw new Error("File is too large (5MB max).");
  }

  const previousPath = await appSettings.getBusinessLogoPath();
  const path = newLogoStoragePath(file.name);
  const { error } = await supabase.storage
    .from(BUSINESS_ASSETS_BUCKET)
    .upload(path, file, { contentType: file.type || undefined });
  if (error) throw new Error(error.message);

  await appSettings.setBusinessLogoPath(path);
  if (previousPath) {
    await supabase.storage.from(BUSINESS_ASSETS_BUCKET).remove([previousPath]);
  }
  // Shown on every screen, not just this settings page.
  revalidatePath("/", "layout");
}

export async function removeBusinessLogo() {
  await requireOwner();
  const previousPath = await appSettings.getBusinessLogoPath();
  await appSettings.setBusinessLogoPath(null);
  if (previousPath) {
    await supabase.storage.from(BUSINESS_ASSETS_BUCKET).remove([previousPath]);
  }
  revalidatePath("/", "layout");
}

export async function createBusinessEntity(formData: FormData) {
  await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const address = String(formData.get("address") ?? "").trim() || null;
  const contactInfo = String(formData.get("contactInfo") ?? "").trim() || null;
  await businessEntities.createBusinessEntity({ name, address, contactInfo });
  revalidatePath("/settings/business");
}

export async function updateBusinessEntity(id: string, formData: FormData) {
  await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const address = String(formData.get("address") ?? "").trim() || null;
  const contactInfo = String(formData.get("contactInfo") ?? "").trim() || null;
  await businessEntities.updateBusinessEntity(id, { name, address, contactInfo });
  revalidatePath("/settings/business");
}

export async function activateBusinessEntity(id: string) {
  await requireOwner();
  await businessEntities.setBusinessEntityActive(id, true);
  revalidatePath("/settings/business");
}

export async function deactivateBusinessEntity(id: string) {
  await requireOwner();
  await businessEntities.setBusinessEntityActive(id, false);
  revalidatePath("/settings/business");
}

export interface ActionResult {
  error: string | null;
}

export async function updateInvoiceAgingThresholds(formData: FormData): Promise<ActionResult> {
  await requireOwner();
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
  await requireOwner();
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
