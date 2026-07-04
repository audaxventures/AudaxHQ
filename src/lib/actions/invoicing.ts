"use server";

import { revalidatePath } from "next/cache";
import { markInvoicePaid as markInvoicePaidData } from "@/lib/data/clients";

export async function markInvoicePaid(clientId: string, invoiceId: string) {
  await markInvoicePaidData(invoiceId);
  revalidatePath("/invoices");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
}
