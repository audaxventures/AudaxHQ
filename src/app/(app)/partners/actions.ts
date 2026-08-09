"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import * as partners from "@/lib/data/partners";
import * as notifications from "@/lib/data/notifications";
import * as teamMembers from "@/lib/data/teamMembers";
import { requireOwner, requirePartnerAccess } from "@/lib/currentUser";
import { resolveAssignedTeamMemberId, selfId, actorDisplayName } from "@/lib/assign";
import { extractMentionIds } from "@/lib/mentions";
import type { CommissionStatus, CurrentUser, EntityColor } from "@/lib/types";

const partnerSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactName: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  commissionTerms: z.string().optional(),
  color: z.enum(["navy", "slate", "blue", "teal", "sage", "burnt", "gold", "brick", "rose", "violet"]).optional(),
});

function parsePartnerForm(formData: FormData) {
  const parsed = partnerSchema.parse({
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName") || undefined,
    contactEmail: formData.get("contactEmail") || undefined,
    contactPhone: formData.get("contactPhone") || undefined,
    commissionTerms: formData.get("commissionTerms") || undefined,
    color: formData.get("color") || undefined,
  });
  return {
    companyName: parsed.companyName,
    contactName: parsed.contactName ?? null,
    contactEmail: parsed.contactEmail ?? null,
    contactPhone: parsed.contactPhone ?? null,
    commissionTerms: parsed.commissionTerms ?? null,
    color: parsed.color ?? null,
  };
}

export async function createPartner(formData: FormData) {
  const user = await requireOwner();
  const input = parsePartnerForm(formData);
  const partner = await partners.createPartner(user.businessId, input);
  revalidatePath("/partners");
  redirect(`/partners/${partner.id}`);
}

export async function updatePartner(id: string, formData: FormData) {
  const user = await requirePartnerAccess(id);
  const input = parsePartnerForm(formData);
  await partners.updatePartner(id, user.businessId, input);
  revalidatePath(`/partners/${id}`);
  revalidatePath("/partners");
}

export async function setPartnerColor(id: string, color: EntityColor | null) {
  const user = await requirePartnerAccess(id);
  await partners.setPartnerColor(id, user.businessId, color);
  revalidatePath(`/partners/${id}`);
  revalidatePath("/partners");
}

export async function setPartnerActive(id: string, active: boolean) {
  const user = await requirePartnerAccess(id);
  await partners.setPartnerActive(id, user.businessId, active);
  revalidatePath(`/partners/${id}`);
  revalidatePath("/partners");
}

/** Hard-deletes only when the partner has no referrals or commission history to lose; otherwise archives it (setPartnerActive(false)) so that history stays intact. */
export async function deletePartner(id: string) {
  const user = await requirePartnerAccess(id);
  if (await partners.partnerHasHistory(id, user.businessId)) {
    await partners.setPartnerActive(id, user.businessId, false);
  } else {
    await partners.deletePartner(id, user.businessId);
  }
  revalidatePath("/partners");
  redirect("/partners");
}

const commissionSchema = z.object({
  referredLeadId: z.string().optional(),
  referredClientId: z.string().optional(),
  amount: z.coerce.number().min(0, "Amount can't be negative"),
  status: z.enum(["OWED", "PAID"]),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  paidDate: z.string().optional(),
});

function parseCommissionForm(formData: FormData) {
  const parsed = commissionSchema.parse({
    referredLeadId: formData.get("referredLeadId") || undefined,
    referredClientId: formData.get("referredClientId") || undefined,
    amount: formData.get("amount") || 0,
    status: formData.get("status") || "OWED",
    description: formData.get("description") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    paidDate: formData.get("paidDate") || undefined,
  });
  return {
    referredLeadId: parsed.referredLeadId ?? null,
    referredClientId: parsed.referredClientId ?? null,
    amount: parsed.amount,
    status: parsed.status as CommissionStatus,
    description: parsed.description ?? null,
    dueDate: parsed.dueDate ?? null,
    paidDate: parsed.paidDate ?? null,
  };
}

export async function createCommission(partnerId: string, formData: FormData) {
  const user = await requirePartnerAccess(partnerId);
  const input = parseCommissionForm(formData);
  await partners.createCommission(partnerId, user.businessId, input);
  revalidatePath(`/partners/${partnerId}`);
}

export async function updateCommission(id: string, partnerId: string, formData: FormData) {
  const user = await requirePartnerAccess(partnerId);
  const input = parseCommissionForm(formData);
  await partners.updateCommission(id, user.businessId, input);
  revalidatePath(`/partners/${partnerId}`);
}

export async function markCommissionPaid(id: string, partnerId: string, paidDate: string) {
  const user = await requirePartnerAccess(partnerId);
  await partners.markCommissionPaid(id, user.businessId, paidDate);
  revalidatePath(`/partners/${partnerId}`);
}

export async function deleteCommission(id: string, partnerId: string) {
  const user = await requirePartnerAccess(partnerId);
  await partners.deleteCommission(id, user.businessId);
  revalidatePath(`/partners/${partnerId}`);
}

/** Fires a "mentioned you" notification for each valid @mention in a note body — mirrors notifyMentionedTeamMembers in clients/actions.ts and leads/actions.ts. */
async function notifyMentionedTeamMembers(user: CurrentUser, body: string, link: string, entityLabel: string) {
  const rawIds = extractMentionIds(body);
  if (rawIds.length === 0) return;
  const self = selfId(user);
  const validIds = new Set((await teamMembers.listTeamMembers(user.businessId)).map((t) => t.id));
  const recipients = new Set<string | null>();
  for (const raw of rawIds) {
    const recipientId = resolveAssignedTeamMemberId(raw, user);
    if (recipientId === self) continue;
    if (recipientId !== null && !validIds.has(recipientId)) continue;
    recipients.add(recipientId);
  }
  await Promise.all(
    [...recipients].map((recipientId) =>
      notifications.createNotification(
        user.businessId,
        recipientId,
        "MENTION",
        `${actorDisplayName(user)} mentioned you in a note on ${entityLabel}`,
        link
      )
    )
  );
}

export async function addPartnerNote(partnerId: string, formData: FormData) {
  const user = await requirePartnerAccess(partnerId);
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  await partners.addPartnerNote(partnerId, user.businessId, body, selfId(user));
  const companyName = await partners.getPartnerCompanyName(partnerId, user.businessId);
  await notifyMentionedTeamMembers(user, body, `/partners/${partnerId}`, companyName ?? "a partner");
  revalidatePath(`/partners/${partnerId}`);
}

export async function updatePartnerNote(partnerId: string, noteId: string, formData: FormData) {
  const user = await requirePartnerAccess(partnerId);
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  await partners.updatePartnerNote(noteId, user.businessId, body);
  revalidatePath(`/partners/${partnerId}`);
}
