"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import * as businesses from "@/lib/data/businesses";
import * as workTypes from "@/lib/data/workTypes";
import * as leadSources from "@/lib/data/leadSources";
import * as todoTypes from "@/lib/data/todoTypes";
import * as feedback from "@/lib/data/feedback";
import * as teamMembers from "@/lib/data/teamMembers";
import { isCorrectPasscodeHash, hashPasscode } from "@/lib/auth";
import { requireOwner, requireOwnerIgnoringBilling, requireCurrentUser } from "@/lib/currentUser";
import { supabase, BUSINESS_ASSETS_BUCKET } from "@/lib/storage";
import { MAX_LOGO_SIZE_BYTES, isAllowedLogoExtension, newLogoStoragePath } from "@/lib/businessLogo";
import { createCheckoutSession, createPortalSession, createStripeCustomer } from "@/lib/stripe";
import type { BillingInterval, BusinessTier, EntityColor } from "@/lib/types";

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
  const defaultHourlyRate = Number(formData.get("defaultHourlyRate") ?? 0);
  await businesses.updateBusinessOwnerProfile(user.businessId, { ownerName: name, ownerEmail: email, timezone });
  // Keeps the owner's linked team_members row (rate + name, used when they
  // log their own time — see migration 039) in sync with the name/rate
  // just saved here, so it never drifts from what Profile shows.
  const ownerTeamMember = await teamMembers.ensureOwnerTeamMember(user.businessId);
  await teamMembers.updateTeamMember(ownerTeamMember.id, user.businessId, { name, defaultHourlyRate });
  // Timezone changes what "today" is computed as almost everywhere in the
  // app, not just this settings page — revalidate the whole (app) section.
  revalidatePath("/", "layout");
}

/**
 * Self-service — updates the current user's own email notification
 * preferences (see migration 048). Owner writes to businesses, team member
 * writes to their own team_members row; each role can only ever touch its
 * own preferences here, there's no "set this for someone else" path.
 */
export async function updateNotificationPreferences(formData: FormData) {
  const user = await requireCurrentUser();
  const prefs = {
    notifyTaskAssigned: formData.get("notifyTaskAssigned") === "on",
    notifyFollowUpAssigned: formData.get("notifyFollowUpAssigned") === "on",
    notifyMention: formData.get("notifyMention") === "on",
  };
  if (user.role === "OWNER") {
    await businesses.updateOwnerNotificationPreferences(user.businessId, {
      ownerNotifyTaskAssigned: prefs.notifyTaskAssigned,
      ownerNotifyFollowUpAssigned: prefs.notifyFollowUpAssigned,
      ownerNotifyMention: prefs.notifyMention,
    });
  } else {
    await teamMembers.updateTeamMemberNotificationPreferences(user.teamMember.id, user.businessId, prefs);
  }
  revalidatePath("/settings/notifications");
}

/** The owner's tag color (their linked team_members row) — shown wherever they're tagged, e.g. the Lead Owner tag on the Leads page. */
export async function setOwnerColor(color: EntityColor | null) {
  const user = await requireOwner();
  const ownerTeamMember = await teamMembers.ensureOwnerTeamMember(user.businessId);
  await teamMembers.setTeamMemberColor(ownerTeamMember.id, user.businessId, color);
  revalidatePath("/settings/profile");
  revalidatePath("/leads");
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

export async function updateBusinessName(formData: FormData) {
  const user = await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await businesses.updateBusinessName(user.businessId, name);
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
    return { error: "Current password is incorrect." };
  }
  if (newPasscode.length < 4) {
    return { error: "New password must be at least 4 characters." };
  }
  if (newPasscode !== confirmPasscode) {
    return { error: "New password and confirmation don't match." };
  }

  const { hash, salt } = hashPasscode(newPasscode);
  await businesses.setPasscodeCredentials(user.businessId, hash, salt);
  revalidatePath("/settings/passcode");
  return { error: null };
}

/** Dismisses the first-login welcome popup for good — see migration 023. */
export async function dismissOnboarding() {
  const user = await requireOwner();
  await businesses.dismissOnboarding(user.businessId);
  revalidatePath("/", "layout");
}

export async function submitFeedback(formData: FormData) {
  const user = await requireOwner();
  const message = String(formData.get("message") ?? "").trim();
  if (!message) return;

  await feedback.createFeedback(user.businessId, {
    submittedByName: user.business.ownerName,
    submittedByRole: "OWNER",
    message,
  });
  revalidatePath("/settings/feedback");
}

export async function deleteFeedback(feedbackId: string) {
  const user = await requireOwner();
  await feedback.deleteFeedback(user.businessId, feedbackId);
  revalidatePath("/settings/feedback");
}

function currentOrigin(host: string | null): string {
  const protocol = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}`;
}

/**
 * Starts (or restarts) a subscription — used both by a brand-new signup
 * that never completed Checkout and by an existing workspace switching
 * tier/interval outside the self-serve portal. Creates a Stripe customer
 * first if this workspace somehow doesn't have one yet (very old
 * early-access workspaces backfilled by migration 042).
 */
export async function startSubscriptionCheckout(tier: BusinessTier, interval: BillingInterval) {
  const user = await requireOwnerIgnoringBilling();
  const origin = currentOrigin((await headers()).get("host"));

  let customerId = user.business.stripeCustomerId;
  if (!customerId) {
    customerId = await createStripeCustomer(user.businessId, user.business.ownerEmail, user.business.name);
    await businesses.setStripeCustomerId(user.businessId, customerId);
  }

  const checkoutUrl = await createCheckoutSession({
    businessId: user.businessId,
    customerId,
    tier,
    interval,
    successUrl: `${origin}/settings/billing?checkout=success`,
    cancelUrl: `${origin}/settings/billing?checkout=canceled`,
  });
  redirect(checkoutUrl);
}

/** Stripe's hosted self-serve page — upgrade/downgrade tier, switch monthly/annual, update a card, or cancel. */
export async function openBillingPortal() {
  const user = await requireOwnerIgnoringBilling();
  if (!user.business.stripeCustomerId) throw new Error("No billing account yet — start a subscription first.");
  const origin = currentOrigin((await headers()).get("host"));
  const portalUrl = await createPortalSession(user.business.stripeCustomerId, `${origin}/settings/billing`);
  redirect(portalUrl);
}
