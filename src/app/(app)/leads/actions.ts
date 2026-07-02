"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import * as leads from "@/lib/data/leads";

const leadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  status: z.enum(["NEW", "CONTACTED", "PROPOSAL_SENT", "NEGOTIATING", "WON", "LOST"]),
  estimatedValue: z.coerce.number().optional(),
  nextFollowUpDate: z.string().optional(),
});

function parseLeadForm(formData: FormData) {
  const parsed = leadSchema.parse({
    name: formData.get("name"),
    company: formData.get("company") || undefined,
    contactEmail: formData.get("contactEmail") || undefined,
    contactPhone: formData.get("contactPhone") || undefined,
    status: formData.get("status"),
    estimatedValue: formData.get("estimatedValue") || undefined,
    nextFollowUpDate: formData.get("nextFollowUpDate") || undefined,
  });
  return {
    ...parsed,
    company: parsed.company ?? null,
    contactEmail: parsed.contactEmail ?? null,
    contactPhone: parsed.contactPhone ?? null,
    estimatedValue: parsed.estimatedValue ?? null,
    nextFollowUpDate: parsed.nextFollowUpDate ?? null,
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
  const input = parseLeadForm(formData);
  await leads.updateLead(id, input);
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
