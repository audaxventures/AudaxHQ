"use server";

import { revalidatePath } from "next/cache";
import * as notifications from "@/lib/data/notifications";
import { requireCurrentUser } from "@/lib/currentUser";
import { selfId } from "@/lib/assign";

export async function markNotificationRead(id: string) {
  const user = await requireCurrentUser();
  await notifications.markNotificationRead(id, user.businessId, selfId(user));
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead() {
  const user = await requireCurrentUser();
  await notifications.markAllNotificationsRead(user.businessId, selfId(user));
  revalidatePath("/", "layout");
}
