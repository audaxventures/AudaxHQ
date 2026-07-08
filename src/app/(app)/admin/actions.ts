"use server";

import { revalidatePath } from "next/cache";
import * as admin from "@/lib/data/admin";
import { requirePlatformAdmin } from "@/lib/currentUser";

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
