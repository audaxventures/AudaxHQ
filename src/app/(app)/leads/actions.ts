"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import * as leads from "@/lib/data/leads";
import { getBusinessToday } from "@/lib/data/businesses";
import { requireCurrentUser } from "@/lib/currentUser";
import type { EntityColor } from "@/lib/types";

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
  color: z.enum(["navy", "slate", "blue", "sage", "burnt", "gold", "brick", "violet"]).optional(),
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
  const input = parseLeadForm(formData);
  const lead = await leads.createLead(input);
  revalidatePath("/leads");
  revalidatePath("/");
  redirect(`/leads/${lead.id}`);
}

export async function updateLead(id: string, formData: FormData) {
  const user = await requireCurrentUser();
  const input = parseLeadForm(formData);
  const result = await leads.updateLead(id, input, await getBusinessToday(user.businessId));
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
  await leads.setLeadColor(id, color);
  revalidatePath(`/leads/${id}`);
  revalidatePath("/leads");
  revalidatePath("/");
}

export async function deleteLead(id: string) {
  await leads.deleteLead(id);
  revalidatePath("/leads");
  revalidatePath("/");
  redirect("/leads");
}

export async function addLeadNote(leadId: string, formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  await leads.addLeadNote(leadId, body);
  revalidatePath(`/leads/${leadId}`);
}

export async function convertLeadToClient(leadId: string) {
  const user = await requireCurrentUser();
  const clientId = await leads.convertLeadToClient(leadId, await getBusinessToday(user.businessId));
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/clients");
  revalidatePath("/");
  redirect(`/clients/${clientId}`);
}
