"use client";

import { useState, useTransition } from "react";
import { Input, Label, FieldGroup } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { AppSettings } from "@/lib/types";
import { updateInvoiceAgingThresholds } from "@/app/(app)/settings/actions";

export function InvoiceAgingForm({ settings }: { settings: AppSettings }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={(formData) => {
        setError(null);
        setSaved(false);
        startTransition(async () => {
          const result = await updateInvoiceAgingThresholds(formData);
          if (result.error) setError(result.error);
          else setSaved(true);
        });
      }}
      className="max-w-md space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <FieldGroup>
          <Label htmlFor="underDays">&ldquo;Under&rdquo; threshold (days)</Label>
          <Input
            id="underDays"
            name="underDays"
            type="number"
            min="1"
            step="1"
            defaultValue={settings.invoiceAgingUnderDays}
            required
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="overDays">&ldquo;Over&rdquo; threshold (days)</Label>
          <Input
            id="overDays"
            name="overDays"
            type="number"
            min="1"
            step="1"
            defaultValue={settings.invoiceAgingOverDays}
            required
          />
        </FieldGroup>
      </div>
      <p className="text-xs text-navy-400">
        Invoices under {settings.invoiceAgingUnderDays} days are shown as on-time, {settings.invoiceAgingUnderDays}–
        {settings.invoiceAgingOverDays} days as aging, and {settings.invoiceAgingOverDays}+ days as overdue.
      </p>
      {error && <p className="text-sm text-brick-600">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {saved && !pending && <p className="text-sm text-sage-600">Saved.</p>}
      </div>
    </form>
  );
}
