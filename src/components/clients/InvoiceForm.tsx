"use client";

import { useFormStatus } from "react-dom";
import { Input, Select, Label, FieldGroup } from "@/components/ui/Field";
import type { InvoiceStatus } from "@/lib/types";
import { formatDateInput } from "@/lib/format";
import { updateProjectInvoice, updateRecurringInvoice } from "@/app/(app)/clients/actions";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-navy-900 px-3.5 py-1.5 text-sm font-medium text-cream-50 hover:bg-navy-800 disabled:opacity-50 cursor-pointer transition-colors self-start"
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

export function InvoiceForm({
  clientId,
  invoiceId,
  amount,
  status,
  invoicedDate,
  paidDate,
  amountLabel = "Amount ($)",
}: {
  clientId: string;
  invoiceId?: string;
  amount: string;
  status: InvoiceStatus;
  invoicedDate: string | null;
  paidDate: string | null;
  amountLabel?: string;
}) {
  const action = invoiceId
    ? updateRecurringInvoice.bind(null, clientId, invoiceId)
    : updateProjectInvoice.bind(null, clientId);

  return (
    <form action={action} className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
      <FieldGroup>
        <Label htmlFor="amount">{amountLabel}</Label>
        <Input id="amount" name="amount" type="number" step="0.01" min="0" defaultValue={amount} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="status">Status</Label>
        <Select id="status" name="status" defaultValue={status}>
          <option value="NOT_INVOICED">Not invoiced</option>
          <option value="INVOICED">Invoiced</option>
          <option value="PAID">Paid</option>
        </Select>
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="invoicedDate">Invoiced</Label>
        <Input id="invoicedDate" name="invoicedDate" type="date" defaultValue={formatDateInput(invoicedDate)} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="paidDate">Paid</Label>
        <Input id="paidDate" name="paidDate" type="date" defaultValue={formatDateInput(paidDate)} />
      </FieldGroup>
      <div className="col-span-2 sm:col-span-4">
        <SaveButton />
      </div>
    </form>
  );
}
