"use server";

import { revalidatePath } from "next/cache";
import { markInvoicePaid as markInvoicePaidData } from "@/lib/data/clients";
import { getBusinessToday } from "@/lib/data/businesses";
import { requireCurrentUser } from "@/lib/currentUser";

export async function markInvoicePaid(clientId: string, invoiceId: string) {
  const user = await requireCurrentUser();
  await markInvoicePaidData(invoiceId, await getBusinessToday(user.businessId));
  revalidatePath("/invoices");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
}
