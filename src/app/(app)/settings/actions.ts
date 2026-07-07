"use server";

import { revalidatePath } from "next/cache";
import * as businesses from "@/lib/data/businesses";
import * as billingEntities from "@/lib/data/billingEntities";
import * as workTypes from "@/lib/data/workTypes";
import * as leadSources from "@/lib/data/leadSources";
import * as todoTypes from "@/lib/data/todoTypes";
import { isCorrectPasscodeHash, hashPasscode } from "@/lib/auth";
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
  const user = await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await workTypes.createWorkType(user.businessId, name);
  revalidateWorkTypes();
}

export async function updateWorkType(id: string, formData: FormData) {
  const user = await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await workTypes.updateWorkType(id, user.businessId, name);
  revalidateWorkTypes();
}

export async function activateWorkType(id: string) {
  const user = await requireOwner();
  await workTypes.setWorkTypeActive(id, user.businessId, true);
  revalidateWorkTypes();
}

export async function deactivateWorkType(id: string) {
  const user = await requireOwner();
  await workTypes.setWorkTypeActive(id, user.businessId, false);
  revalidateWorkTypes();
}

export async function createLeadSource(formData: FormData) {
  const user = await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await leadSources.createLeadSource(user.businessId, name);
  revalidateLeadSources();
}

export async function updateLeadSource(id: string, formData: FormData) {
  const user = await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await leadSources.updateLeadSource(id, user.businessId, name);
  revalidateLeadSources();
}

export async function activateLeadSource(id: string) {
  const user = await requireOwner();
  await leadSources.setLeadSourceActive(id, user.businessId, true);
  revalidateLeadSources();
}

export async function deactivateLeadSource(id: string) {
  const user = await requireOwner();
  await leadSources.setLeadSourceActive(id, user.businessId, false);
  revalidateLeadSources();
}

export async function createTodoType(formData: FormData) {
  const user = await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await todoTypes.createTodoType(user.businessId, name);
  revalidateTodoTypes();
}

export async function updateTodoType(id: string, formData: FormData) {
  const user = await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await todoTypes.updateTodoType(id, user.businessId, name);
  revalidateTodoTypes();
}

export async function activateTodoType(id: string) {
  const user = await requireOwner();
  await todoTypes.setTodoTypeActive(id, user.businessId, true);
  revalidateTodoTypes();
}

export async function deactivateTodoType(id: string) {
  const user = await requireOwner();
  await todoTypes.setTodoTypeActive(id, user.businessId, false);
  revalidateTodoTypes();
}

export async function updateProfile(formData: FormData) {
  const user = await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "").trim() || "UTC";
  await businesses.updateBusinessOwnerProfile(user.businessId, { ownerName: name, ownerEmail: email, timezone });
  // Timezone changes what "today" is computed as almost everywhere in the
  // app, not just this settings page — revalidate the whole (app) section.
  revalidatePath("/", "layout");
}

export async function uploadBusinessLogo(formData: FormData) {
  const user = await requireOwner();
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

  const previousPath = await businesses.getBusinessLogoPath(user.businessId);
  const path = newLogoStoragePath(user.businessId, file.name);
  const { error } = await supabase.storage
    .from(BUSINESS_ASSETS_BUCKET)
    .upload(path, file, { contentType: file.type || undefined });
  if (error) throw new Error(error.message);

  await businesses.setBusinessLogoPath(user.businessId, path);
  if (previousPath) {
    await supabase.storage.from(BUSINESS_ASSETS_BUCKET).remove([previousPath]);
  }
  // Shown on every screen, not just this settings page.
  revalidatePath("/", "layout");
}

export async function removeBusinessLogo() {
  const user = await requireOwner();
  const previousPath = await businesses.getBusinessLogoPath(user.businessId);
  await businesses.setBusinessLogoPath(user.businessId, null);
  if (previousPath) {
    await supabase.storage.from(BUSINESS_ASSETS_BUCKET).remove([previousPath]);
  }
  revalidatePath("/", "layout");
}

export async function createBillingEntity(formData: FormData) {
  const user = await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const address = String(formData.get("address") ?? "").trim() || null;
  const contactInfo = String(formData.get("contactInfo") ?? "").trim() || null;
  await billingEntities.createBillingEntity(user.businessId, { name, address, contactInfo });
  revalidatePath("/settings/business");
}

export async function updateBillingEntity(id: string, formData: FormData) {
  const user = await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const address = String(formData.get("address") ?? "").trim() || null;
  const contactInfo = String(formData.get("contactInfo") ?? "").trim() || null;
  await billingEntities.updateBillingEntity(id, user.businessId, { name, address, contactInfo });
  revalidatePath("/settings/business");
}

export async function activateBillingEntity(id: string) {
  const user = await requireOwner();
  await billingEntities.setBillingEntityActive(id, user.businessId, true);
  revalidatePath("/settings/business");
}

export async function deactivateBillingEntity(id: string) {
  const user = await requireOwner();
  await billingEntities.setBillingEntityActive(id, user.businessId, false);
  revalidatePath("/settings/business");
}

export interface ActionResult {
  error: string | null;
}

export async function updateInvoiceAgingThresholds(formData: FormData): Promise<ActionResult> {
  const user = await requireOwner();
  const underDays = Number(formData.get("underDays"));
  const overDays = Number(formData.get("overDays"));
  if (!(underDays > 0) || !(overDays > underDays)) {
    return { error: "The 'over' threshold must be greater than the 'under' threshold, and both must be positive." };
  }
  await businesses.updateInvoiceAgingThresholds(user.businessId, underDays, overDays);
  revalidatePath("/settings/invoice-aging");
  revalidatePath("/invoices");
  revalidatePath("/");
  return { error: null };
}

export async function changePasscode(formData: FormData): Promise<ActionResult> {
  const user = await requireOwner();
  const currentPasscode = String(formData.get("currentPasscode") ?? "");
  const newPasscode = String(formData.get("newPasscode") ?? "");
  const confirmPasscode = String(formData.get("confirmPasscode") ?? "");

  const creds = await businesses.getPasscodeCredentials(user.businessId);
  if (!isCorrectPasscodeHash(currentPasscode, creds.hash, creds.salt)) {
    return { error: "Current passcode is incorrect." };
  }
  if (newPasscode.length < 4) {
    return { error: "New passcode must be at least 4 characters." };
  }
  if (newPasscode !== confirmPasscode) {
    return { error: "New passcode and confirmation don't match." };
  }

  const { hash, salt } = hashPasscode(newPasscode);
  await businesses.setPasscodeCredentials(user.businessId, hash, salt);
  revalidatePath("/settings/passcode");
  return { error: null };
}
