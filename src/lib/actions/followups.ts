"use server";

import { revalidatePath } from "next/cache";
import * as followups from "@/lib/data/followups";
import type { FollowUpStatus } from "@/lib/types";

function revalidateOwner(clientId?: string, leadId?: string) {
  if (clientId) revalidatePath(`/clients/${clientId}`);
  if (leadId) revalidatePath(`/leads/${leadId}`);
  revalidatePath("/");
}

export async function addFollowUp(
  owner: { clientId: string } | { leadId: string },
  formData: FormData
) {
  const label = String(formData.get("label") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  if (!label || !date) return;
  await followups.addFollowUp(owner, { label, date });
  revalidateOwner("clientId" in owner ? owner.clientId : undefined, "leadId" in owner ? owner.leadId : undefined);
}

export async function setFollowUpStatus(
  id: string,
  status: FollowUpStatus,
  owner: { clientId?: string; leadId?: string }
) {
  await followups.setFollowUpStatus(id, status);
  revalidateOwner(owner.clientId, owner.leadId);
}

export async function deleteFollowUp(id: string, owner: { clientId?: string; leadId?: string }) {
  await followups.deleteFollowUp(id);
  revalidateOwner(owner.clientId, owner.leadId);
}
