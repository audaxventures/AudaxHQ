"use server";

import { revalidatePath } from "next/cache";
import { markInvoicePaid as markInvoicePaidData } from "@/lib/data/clients";
import { getToday } from "@/lib/data/profile";

export async function markInvoicePaid(clientId: string, invoiceId: string) {
  await markInvoicePaidData(invoiceId, await getToday());
  revalidatePath("/invoices");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
}
