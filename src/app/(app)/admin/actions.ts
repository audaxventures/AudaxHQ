"use server";

import { revalidatePath } from "next/cache";
import * as admin from "@/lib/data/admin";
import { requirePlatformAdmin } from "@/lib/currentUser";
import { deleteAllBusinessFiles } from "@/lib/storage";
import type { FeedbackStatus } from "@/lib/types";

export async function suspendWorkspace(businessId: string) {
  await requirePlatformAdmin();
  await admin.suspendBusiness(businessId);
  revalidatePath("/admin");
}

export async function reactivateWorkspace(businessId: string) {
  await requirePlatformAdmin();
  await admin.reactivateBusiness(businessId);
  revalidatePath("/admin");
}

/**
 * `confirmName` is whatever the admin typed into the "type the workspace
 * name to confirm" field — deleteBusiness re-checks it (and the suspended
 * requirement) against the real row rather than trusting the client.
 * Storage cleanup runs best-effort: a bucket hiccup shouldn't block the
 * (irreversible) database delete, which is the part that actually matters
 * for "this workspace can no longer be used."
 */
export async function deleteWorkspacePermanently(businessId: string, confirmName: string) {
  await requirePlatformAdmin();
  try {
    await deleteAllBusinessFiles(businessId);
  } catch (err) {
    console.error(`Failed to clean up storage for deleted business ${businessId}`, err);
  }
  await admin.deleteBusiness(businessId, confirmName);
  revalidatePath("/admin");
}

export async function updateFeedbackStatus(feedbackId: string, status: FeedbackStatus) {
  await requirePlatformAdmin();
  await admin.setFeedbackStatus(feedbackId, status);
  revalidatePath("/admin/feedback");
}

export async function deleteFeedback(feedbackId: string) {
  await requirePlatformAdmin();
  await admin.deleteFeedback(feedbackId);
  revalidatePath("/admin/feedback");
}
