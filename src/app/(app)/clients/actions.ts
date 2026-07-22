"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import * as clients from "@/lib/data/clients";
import * as clientAccess from "@/lib/data/clientAccess";
import * as notifications from "@/lib/data/notifications";
import * as teamMembers from "@/lib/data/teamMembers";
import { getBusinessToday } from "@/lib/data/businesses";
import { requireClientAccess, requireCurrentUser, requireOwner } from "@/lib/currentUser";
import { resolveAssignedTeamMemberId, selfId, actorDisplayName } from "@/lib/assign";
import { extractMentionIds } from "@/lib/mentions";
import { deleteClientFiles } from "@/lib/storage";
import type { CurrentUser, EntityColor } from "@/lib/types";

const clientSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactName: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  type: z.enum(["PROJECT", "RECURRING"]),
  status: z.enum(["ACTIVE", "PAUSED", "CHURNED"]),
  rate: z.coerce.number().min(0),
  workTypeId: z.string().optional(),
  workTypeOther: z.string().optional(),
  startDate: z.string().optional(),
  budgetedHours: z.coerce.number().min(0).optional(),
  color: z.enum(["navy", "slate", "blue", "teal", "sage", "burnt", "gold", "brick", "rose", "violet"]).optional(),
});

/**
 * `fallbackRate` covers team members editing a client with the rate field
 * hidden (ClientForm's hideRate) — formData.get("rate") is null (never
 * submitted) rather than an empty string, so without a fallback the client's
 * existing rate would silently get zeroed out by an unrelated edit.
 */
function parseClientForm(formData: FormData, fallbackRate = 0) {
  const rate = formData.get("rate");
  const parsed = clientSchema.parse({
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName") || undefined,
    contactEmail: formData.get("contactEmail") || undefined,
    contactPhone: formData.get("contactPhone") || undefined,
    type: formData.get("type"),
    status: formData.get("status"),
    rate: rate !== null ? rate || 0 : fallbackRate,
    workTypeId: formData.get("workTypeId") || undefined,
    // Only ever submitted by the form when the "Other" fallback work type is selected.
    workTypeOther: formData.get("workTypeOther") || undefined,
    startDate: formData.get("startDate") || undefined,
    budgetedHours: formData.get("budgetedHours") || undefined,
    color: formData.get("color") || undefined,
  });
  return {
    ...parsed,
    contactName: parsed.contactName ?? null,
    contactEmail: parsed.contactEmail ?? null,
    contactPhone: parsed.contactPhone ?? null,
    workTypeId: parsed.workTypeId ?? null,
    workTypeOther: parsed.workTypeOther ?? null,
    startDate: parsed.startDate ?? null,
    budgetedHours: parsed.budgetedHours ?? null,
    color: parsed.color ?? null,
  };
}

export async function createClient(formData: FormData) {
  const user = await requireCurrentUser();
  const input = parseClientForm(formData);
  const client = await clients.createClient(user.businessId, input, await getBusinessToday(user.businessId));

  // Only owners see the "Give access to" checklist (team-member access is
  // owner-managed everywhere else too), so this is a no-op for a team
  // member's own submission — formData simply won't carry teamMemberId.
  if (user.role === "OWNER") {
    const teamMemberIds = formData.getAll("teamMemberId").map((v) => String(v));
    if (teamMemberIds.length > 0) {
      await clientAccess.grantClientAccess(client.id, user.businessId, teamMemberIds);
    }
  }

  revalidatePath("/clients");
  revalidatePath("/");
  redirect(`/clients/${client.id}`);
}

export async function updateClient(id: string, formData: FormData) {
  const user = await requireClientAccess(id);
  const fallbackRate = formData.get("rate") === null ? await clients.getClientRate(id, user.businessId) : 0;
  const input = parseClientForm(formData, fallbackRate);
  await clients.updateClient(id, user.businessId, input, await getBusinessToday(user.businessId));
  revalidatePath(`/clients/${id}`);
  revalidatePath("/clients");
  revalidatePath("/");
}

export async function archiveClient(id: string) {
  const user = await requireClientAccess(id);
  await clients.setClientStatus(id, user.businessId, "CHURNED");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/clients");
  revalidatePath("/");
}

export async function activateClient(id: string) {
  const user = await requireClientAccess(id);
  await clients.setClientStatus(id, user.businessId, "ACTIVE");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/clients");
  revalidatePath("/");
}

/**
 * Owner-only, and only once a client is archived (enforced again in
 * clients.deleteClient) — same "must be suspended first" precondition as
 * the platform admin's deleteWorkspacePermanently, scaled down to one
 * client. Storage cleanup failures are logged rather than thrown so an
 * already-missing or unreachable file never blocks the record itself from
 * being deleted.
 */
export async function deleteClientPermanently(id: string) {
  const user = await requireOwnerClientAccess(id);
  try {
    await deleteClientFiles(user.businessId, id);
  } catch (err) {
    console.error(`Failed to clean up storage for deleted client ${id}`, err);
  }
  await clients.deleteClient(id, user.businessId);
  revalidatePath("/clients");
  revalidatePath("/");
}

export async function setClientColor(id: string, color: EntityColor | null) {
  const user = await requireClientAccess(id);
  await clients.setClientColor(id, user.businessId, color);
  revalidatePath(`/clients/${id}`);
  revalidatePath("/clients");
  revalidatePath("/");
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

export async function addClientNote(clientId: string, formData: FormData) {
  const user = await requireClientAccess(clientId);
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  await clients.addClientNote(clientId, user.businessId, body, selfId(user));
  const companyName = await clients.getClientCompanyName(clientId, user.businessId);
  await notifyMentionedTeamMembers(user, body, `/clients/${clientId}`, companyName ?? "a client");
  revalidatePath(`/clients/${clientId}`);
}

export async function addClientLink(clientId: string, formData: FormData) {
  const user = await requireClientAccess(clientId);
  const label = String(formData.get("label") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!label || !url) return;
  await clients.addClientLink(clientId, user.businessId, label, url);
  revalidatePath(`/clients/${clientId}`);
}

export async function deleteClientLink(clientId: string, linkId: string) {
  const user = await requireClientAccess(clientId);
  await clients.deleteClientLink(linkId, user.businessId);
  revalidatePath(`/clients/${clientId}`);
}

const invoiceSchema = z.object({
  label: z.string().min(1, "Label is required"),
  invoiceType: z.enum(["FIXED", "HOURLY"]),
  amount: z.coerce.number().min(0).optional(),
  hours: z.coerce.number().min(0).optional(),
  hourlyRate: z.coerce.number().min(0).optional(),
  description: z.string().optional(),
  status: z.enum(["NOT_INVOICED", "INVOICED", "PAID"]),
  invoicedDate: z.string().optional(),
  paidDate: z.string().optional(),
});

function parseInvoiceForm(formData: FormData) {
  const parsed = invoiceSchema.parse({
    label: formData.get("label"),
    invoiceType: formData.get("invoiceType") || "FIXED",
    amount: formData.get("amount") || undefined,
    hours: formData.get("hours") || undefined,
    hourlyRate: formData.get("hourlyRate") || undefined,
    description: formData.get("description") || undefined,
    status: formData.get("status"),
    invoicedDate: formData.get("invoicedDate") || undefined,
    paidDate: formData.get("paidDate") || undefined,
  });

  const shared = {
    label: parsed.label,
    description: parsed.description ?? null,
    status: parsed.status,
    invoicedDate: parsed.invoicedDate ?? null,
    paidDate: parsed.paidDate ?? null,
  };

  if (parsed.invoiceType === "HOURLY") {
    const hours = parsed.hours ?? 0;
    const hourlyRate = parsed.hourlyRate ?? 0;
    return { ...shared, invoiceType: "HOURLY" as const, hours, hourlyRate, amount: hours * hourlyRate };
  }

  return { ...shared, invoiceType: "FIXED" as const, hours: null, hourlyRate: null, amount: parsed.amount ?? 0 };
}

/**
 * The invoice form lets someone set status to INVOICED/PAID without ever
 * touching the separate invoicedDate/paidDate fields — without this, that
 * invoice would have no date to attribute revenue to (the whole revenue
 * feature keys off invoicedDate). Defaults each date to today the moment its
 * status is reached, but never overwrites an already-set date.
 */
function backfillInvoiceDates<T extends { status: string; invoicedDate: string | null; paidDate: string | null }>(
  input: T,
  today: string
): T {
  const invoicedDate = (input.status === "INVOICED" || input.status === "PAID") && !input.invoicedDate ? today : input.invoicedDate;
  const paidDate = input.status === "PAID" && !input.paidDate ? today : input.paidDate;
  return { ...input, invoicedDate, paidDate };
}

async function requireOwnerClientAccess(clientId: string) {
  const user = await requireOwner();
  if (!(await clients.clientBelongsToBusiness(clientId, user.businessId))) {
    throw new Error("You don't have access to that client.");
  }
  return user;
}

export async function addInvoice(clientId: string, formData: FormData) {
  const user = await requireOwnerClientAccess(clientId);
  const today = await getBusinessToday(user.businessId);
  const input = backfillInvoiceDates(parseInvoiceForm(formData), today);
  const workType = await clients.getClientWorkType(clientId, user.businessId);
  await clients.addInvoice(clientId, user.businessId, {
    ...input,
    workTypeId: workType?.workTypeId ?? null,
    workTypeOther: workType?.workTypeOther ?? null,
  });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/invoices");
  revalidatePath("/");
}

export async function updateInvoice(clientId: string, invoiceId: string, formData: FormData) {
  const user = await requireOwnerClientAccess(clientId);
  const today = await getBusinessToday(user.businessId);
  const input = backfillInvoiceDates(parseInvoiceForm(formData), today);
  await clients.updateInvoice(invoiceId, user.businessId, input);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/invoices");
  revalidatePath("/");
}

export async function deleteInvoice(clientId: string, invoiceId: string) {
  const user = await requireOwnerClientAccess(clientId);
  await clients.deleteInvoice(invoiceId, user.businessId);
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
}
