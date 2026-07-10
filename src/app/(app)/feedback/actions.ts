"use server";

import { revalidatePath } from "next/cache";
import * as feedback from "@/lib/data/feedback";
import { requireCurrentUser } from "@/lib/currentUser";

export async function submitFeedback(formData: FormData) {
  const user = await requireCurrentUser();
  const message = String(formData.get("message") ?? "").trim();
  if (!message) return;

  const submittedByName = user.role === "OWNER" ? user.business.ownerName : user.teamMember.name;

  await feedback.createFeedback(user.businessId, {
    submittedByName,
    submittedByRole: user.role,
    message,
  });
  revalidatePath("/feedback");
}
