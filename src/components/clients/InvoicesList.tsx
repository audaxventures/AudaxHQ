"use client";

import { useRef, useState, useTransition } from "react";
import { Pencil, Trash2, X, Check, Plus } from "lucide-react";
import { Input, Select, Label, FieldGroup } from "@/components/ui/Field";
import { InvoiceStatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, formatDateInput } from "@/lib/format";
import type { Invoice } from "@/lib/types";
import { addInvoice, deleteInvoice, updateInvoice } from "@/app/(app)/clients/actions";

function TotalStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-navy-100 bg-cream-100/40 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-navy-500">{label}</p>
      <p className="font-heading text-xl text-navy-900 mt-0.5">{formatCurrency(value)}</p>
    </div>
  );
}

function InvoiceEditForm({
  clientId,
  invoice,
  onDone,
}: {
  clientId: string;
  invoice: Invoice;
  onDone: () => void;
}) {
  const [, startTransition] = useTransition();
  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await updateInvoice(clientId, invoice.id, formData);
          onDone();
        });
      }}
      className="space-y-3"
    >
      <FieldGroup>
        <Label htmlFor={`label-${invoice.id}`}>Label</Label>
        <Input id={`label-${invoice.id}`} name="label" defaultValue={invoice.label} required />
      </FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor={`amount-${invoice.id}`}>Amount ($)</Label>
          <Input id={`amount-${invoice.id}`} name="amount" type="number" step="0.01" min="0" defaultValue={invoice.amount} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor={`status-${invoice.id}`}>Status</Label>
          <Select id={`status-${invoice.id}`} name="status" defaultValue={invoice.status}>
            <option value="NOT_INVOICED">Not invoiced</option>
            <option value="INVOICED">Invoiced</option>
            <option value="PAID">Paid</option>
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor={`invoiced-${invoice.id}`}>Invoiced</Label>
          <Input id={`invoiced-${invoice.id}`} name="invoicedDate" type="date" defaultValue={formatDateInput(invoice.invoicedDate)} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor={`paid-${invoice.id}`}>Paid</Label>
          <Input id={`paid-${invoice.id}`} name="paidDate" type="date" defaultValue={formatDateInput(invoice.paidDate)} />
        </FieldGroup>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="flex items-center gap-1 rounded-lg bg-navy-900 px-3 py-1.5 text-sm font-medium text-cream-50 hover:bg-navy-800 cursor-pointer">
          <Check size={14} /> Save
        </button>
        <button type="button" onClick={onDone} className="flex items-center gap-1 rounded-lg border border-navy-200 px-3 py-1.5 text-sm font-medium text-navy-600 hover:bg-navy-100 cursor-pointer">
          <X size={14} /> Cancel
        </button>
      </div>
    </form>
  );
}

function InvoiceRow({ clientId, invoice }: { clientId: string; invoice: Invoice }) {
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();

  if (editing) {
    return (
      <div className="rounded-xl border border-navy-200 bg-cream-100/40 p-4">
        <InvoiceEditForm clientId={clientId} invoice={invoice} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="group flex items-center justify-between gap-3 rounded-xl border border-navy-100 px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-navy-900">{invoice.label}</p>
          <InvoiceStatusBadge status={invoice.status} />
        </div>
        <p className="mt-1 text-xs text-navy-400">
          {invoice.invoicedDate && <>Invoiced {formatDate(invoice.invoicedDate)} </>}
          {invoice.paidDate && <>· Paid {formatDate(invoice.paidDate)}</>}
          {!invoice.invoicedDate && !invoice.paidDate && "Not yet invoiced"}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <p className="font-heading text-base text-navy-900">{formatCurrency(invoice.amount)}</p>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={() => setEditing(true)} className="p-1.5 text-navy-300 hover:text-navy-600 cursor-pointer" aria-label="Edit invoice">
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => startTransition(async () => deleteInvoice(clientId, invoice.id))}
            className="p-1.5 text-navy-300 hover:text-brick-600 cursor-pointer"
            aria-label="Delete invoice"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AddInvoiceForm({ clientId }: { clientId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1.5 text-sm font-medium text-burnt-600 hover:text-burnt-700 cursor-pointer"
      >
        <Plus size={15} /> Add invoice
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          await addInvoice(clientId, formData);
        });
        formRef.current?.reset();
        setExpanded(false);
      }}
      className="rounded-xl border border-dashed border-navy-200 p-4 space-y-3"
    >
      <FieldGroup>
        <Label htmlFor="new-label">Label</Label>
        <Input id="new-label" name="label" placeholder="Deposit, Milestone 2, March 2026…" required />
      </FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="new-amount">Amount ($)</Label>
          <Input id="new-amount" name="amount" type="number" step="0.01" min="0" placeholder="0.00" required />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="new-status">Status</Label>
          <Select id="new-status" name="status" defaultValue="NOT_INVOICED">
            <option value="NOT_INVOICED">Not invoiced</option>
            <option value="INVOICED">Invoiced</option>
            <option value="PAID">Paid</option>
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="new-invoiced">Invoiced</Label>
          <Input id="new-invoiced" name="invoicedDate" type="date" />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="new-paid">Paid</Label>
          <Input id="new-paid" name="paidDate" type="date" />
        </FieldGroup>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-navy-900 px-3.5 py-1.5 text-sm font-medium text-cream-50 hover:bg-navy-800 cursor-pointer">
          Add invoice
        </button>
        <button type="button" onClick={() => setExpanded(false)} className="rounded-lg border border-navy-200 px-3.5 py-1.5 text-sm font-medium text-navy-600 hover:bg-navy-100 cursor-pointer">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function InvoicesList({ clientId, invoices }: { clientId: string; invoices: Invoice[] }) {
  const invoicedTotal = invoices
    .filter((i) => i.status !== "NOT_INVOICED")
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const paidTotal = invoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const remaining = invoices
    .filter((i) => i.status !== "PAID")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <TotalStat label="Invoiced to date" value={invoicedTotal} />
        <TotalStat label="Paid to date" value={paidTotal} />
        <TotalStat label="Remaining" value={remaining} />
      </div>
      <div className="space-y-2 mb-4">
        {invoices.length === 0 ? (
          <p className="text-sm text-navy-400">No invoices yet.</p>
        ) : (
          invoices.map((inv) => <InvoiceRow key={inv.id} clientId={clientId} invoice={inv} />)
        )}
      </div>
      <AddInvoiceForm clientId={clientId} />
    </div>
  );
}
