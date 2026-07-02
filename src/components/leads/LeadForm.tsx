"use client";

import { useFormStatus } from "react-dom";
import { Input, Label, Select, FieldGroup } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { Lead } from "@/lib/types";
import { formatDateInput } from "@/lib/format";
import { createLead, updateLead } from "@/app/(app)/leads/actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function LeadForm({
  lead,
  submitLabel = "Save lead",
}: {
  lead?: Lead;
  submitLabel?: string;
}) {
  const action = lead?.id ? updateLead.bind(null, lead.id) : createLead;

  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required defaultValue={lead?.name} placeholder="Jane Doe" />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="company">Company</Label>
          <Input id="company" name="company" defaultValue={lead?.company ?? ""} placeholder="Acme Inc." />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="contactEmail">Email</Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={lead?.contactEmail ?? ""}
            placeholder="jane@acme.com"
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="contactPhone">Phone</Label>
          <Input id="contactPhone" name="contactPhone" defaultValue={lead?.contactPhone ?? ""} placeholder="(555) 555-5555" />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={lead?.status ?? "NEW"}>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="PROPOSAL_SENT">Proposal sent</option>
            <option value="NEGOTIATING">Negotiating</option>
            <option value="WON">Won</option>
            <option value="LOST">Lost</option>
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="estimatedValue">Estimated value ($)</Label>
          <Input
            id="estimatedValue"
            name="estimatedValue"
            type="number"
            step="0.01"
            min="0"
            defaultValue={lead?.estimatedValue ?? ""}
            placeholder="0.00"
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="nextFollowUpDate">Next follow-up</Label>
          <Input
            id="nextFollowUpDate"
            name="nextFollowUpDate"
            type="date"
            defaultValue={formatDateInput(lead?.nextFollowUpDate)}
          />
        </FieldGroup>
      </div>
      <SubmitButton label={submitLabel} />
    </form>
  );
}
