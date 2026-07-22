"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import * as leads from "@/lib/data/leads";
import * as notifications from "@/lib/data/notifications";
import * as teamMembers from "@/lib/data/teamMembers";
import { getBusinessToday } from "@/lib/data/businesses";
import { requireCurrentUser, requireLeadAccess } from "@/lib/currentUser";
import { resolveAssignedTeamMemberId, selfId, actorDisplayName } from "@/lib/assign";
import { extractMentionIds } from "@/lib/mentions";
import type { CurrentUser, EntityColor } from "@/lib/types";

const leadSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactName: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  status: z.enum(["NEW", "CONTACTED", "PROPOSAL_SENT", "NEGOTIATING", "WON", "LOST"]),
  estimatedValue: z.coerce.number().optional(),
  workTypeId: z.string().optional(),
  workTypeOther: z.string().optional(),
  sourceId: z.string().optional(),
  sourceOther: z.string().optional(),
  color: z.enum(["navy", "slate", "blue", "teal", "sage", "burnt", "gold", "brick", "rose", "violet"]).optional(),
});

function parseLeadForm(formData: FormData) {
  const parsed = leadSchema.parse({
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName") || undefined,
    contactEmail: formData.get("contactEmail") || undefined,
    contactPhone: formData.get("contactPhone") || undefined,
    status: formData.get("status"),
    estimatedValue: formData.get("estimatedValue") || undefined,
    workTypeId: formData.get("workTypeId") || undefined,
    // Only ever submitted by the form when the "Other" fallback row is selected.
    workTypeOther: formData.get("workTypeOther") || undefined,
    sourceId: formData.get("sourceId") || undefined,
    sourceOther: formData.get("sourceOther") || undefined,
    color: formData.get("color") || undefined,
  });
  return {
    companyName: parsed.companyName,
    contactName: parsed.contactName ?? null,
    contactEmail: parsed.contactEmail ?? null,
    contactPhone: parsed.contactPhone ?? null,
    status: parsed.status,
    estimatedValue: parsed.estimatedValue ?? null,
    workTypeId: parsed.workTypeId ?? null,
    workTypeOther: parsed.workTypeOther ?? null,
    sourceId: parsed.sourceId ?? null,
    sourceOther: parsed.sourceOther ?? null,
    color: parsed.color ?? null,
  };
}

export async function createLead(formData: FormData) {
  const user = await requireCurrentUser();
  const input = parseLeadForm(formData);
  const lead = await leads.createLead(user.businessId, input);
  revalidatePath("/leads");
  revalidatePath("/");
  redirect(`/leads/${lead.id}`);
}

export async function updateLead(id: string, formData: FormData) {
  const user = await requireLeadAccess(id);
  const input = parseLeadForm(formData);
  const result = await leads.updateLead(id, user.businessId, input, await getBusinessToday(user.businessId));
  revalidatePath(`/leads/${id}`);
  revalidatePath("/leads");
  revalidatePath("/");
  if (result.convertedClientId) {
    revalidatePath(`/clients/${result.convertedClientId}`);
    revalidatePath("/clients");
    // Redirect (rather than just revalidating in place) so the "converted"
    // confirmation survives outside the form component — the Core Info
    // form remounts on every save (see key={lead.updatedAt} on LeadForm)
    // to keep its fields from going stale, which would otherwise wipe any
    // transient in-form confirmation state before the user sees it.
    redirect(`/leads/${id}?converted=${result.convertedClientId}`);
  }
}

export async function setLeadColor(id: string, color: EntityColor | null) {
  const user = await requireLeadAccess(id);
  await leads.setLeadColor(id, user.businessId, color);
  revalidatePath(`/leads/${id}`);
  revalidatePath("/leads");
  revalidatePath("/");
}

export async function deleteLead(id: string) {
  const user = await requireLeadAccess(id);
  await leads.deleteLead(id, user.businessId);
  revalidatePath("/leads");
  revalidatePath("/");
  redirect("/leads");
}

/** Fires a "mentioned you" notification for each valid @mention in a note body — never for a self-mention, and only for team members who actually exist in this business (a raw @[Name](id) token in a direct POST could otherwise be forged). Mirrors notifyTaskAssignee in actions/tasks.ts. */
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

export async function addLeadNote(leadId: string, formData: FormData) {
  const user = await requireLeadAccess(leadId);
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  await leads.addLeadNote(leadId, user.businessId, body, selfId(user));
  const companyName = await leads.getLeadCompanyName(leadId, user.businessId);
  await notifyMentionedTeamMembers(user, body, `/leads/${leadId}`, companyName ?? "a lead");
  revalidatePath(`/leads/${leadId}`);
}

export async function convertLeadToClient(leadId: string) {
  const user = await requireLeadAccess(leadId);
  const clientId = await leads.convertLeadToClient(leadId, user.businessId, await getBusinessToday(user.businessId));
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/clients");
  revalidatePath("/");
  redirect(`/clients/${clientId}`);
}
