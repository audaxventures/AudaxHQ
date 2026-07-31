"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import * as prospects from "@/lib/data/prospects";
import { requireCurrentUser, requireProspectAccess } from "@/lib/currentUser";
import { selfId } from "@/lib/assign";

const prospectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().optional(),
  phone: z.string().optional(),
  businessName: z.string().optional(),
  title: z.string().optional(),
  industry: z.string().optional(),
  status: z.enum(["NEW", "CONTACTED", "ATTEMPTED", "QUALIFIED", "NOT_INTERESTED", "CONVERTED"]),
  notes: z.string().optional(),
  ownerTeamMemberId: z.string().optional(),
});

function parseProspectForm(formData: FormData) {
  const parsed = prospectSchema.parse({
    name: formData.get("name"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    businessName: formData.get("businessName") || undefined,
    title: formData.get("title") || undefined,
    industry: formData.get("industry") || undefined,
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
    ownerTeamMemberId: formData.get("ownerTeamMemberId") || undefined,
  });
  return {
    name: parsed.name,
    email: parsed.email ?? null,
    phone: parsed.phone ?? null,
    businessName: parsed.businessName ?? null,
    title: parsed.title ?? null,
    industry: parsed.industry ?? null,
    status: parsed.status,
    notes: parsed.notes ?? null,
    ownerTeamMemberId: parsed.ownerTeamMemberId ?? null,
  };
}

function revalidateProspects() {
  revalidatePath("/prospects");
  revalidatePath("/follow-ups");
  revalidatePath("/");
}

export async function createProspect(formData: FormData) {
  const user = await requireCurrentUser();
  const input = parseProspectForm(formData);
  await prospects.createProspect(user.businessId, input);
  revalidateProspects();
}

export async function updateProspect(id: string, formData: FormData) {
  const user = await requireProspectAccess(id);
  const input = parseProspectForm(formData);
  await prospects.updateProspect(id, user.businessId, input);
  revalidateProspects();
}

export async function deleteProspect(id: string) {
  const user = await requireProspectAccess(id);
  await prospects.deleteProspect(id, user.businessId);
  revalidateProspects();
}

export async function addProspectActivity(prospectId: string, formData: FormData) {
  const user = await requireProspectAccess(prospectId);
  const type = String(formData.get("type") ?? "NOTE") as "CALL" | "EMAIL" | "MEETING" | "NOTE";
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  await prospects.addProspectActivity(prospectId, user.businessId, { type, body }, selfId(user));
  revalidateProspects();
}

/** Converts a prospect to a lead and takes the caller straight to the new lead's detail page — the natural next step once a prospect is qualified. */
export async function convertProspectToLead(prospectId: string) {
  const user = await requireProspectAccess(prospectId);
  const leadId = await prospects.convertProspectToLead(prospectId, user.businessId);
  revalidateProspects();
  revalidatePath("/leads");
  redirect(`/leads/${leadId}`);
}
