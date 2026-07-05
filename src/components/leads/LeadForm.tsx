"use client";

import { useFormStatus } from "react-dom";
import { Input, Label, Select, FieldGroup } from "@/components/ui/Field";
import { SelectWithOther } from "@/components/ui/SelectWithOther";
import { Button } from "@/components/ui/Button";
import type { Lead, LeadSource, WorkType } from "@/lib/types";
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
  workTypes,
  leadSources,
  submitLabel = "Save lead",
}: {
  lead?: Lead;
  workTypes: WorkType[];
  leadSources: LeadSource[];
  submitLabel?: string;
}) {
  const action = lead?.id ? updateLead.bind(null, lead.id) : createLead;
  const selectableWorkTypes = workTypes.filter((w) => w.active || w.id === lead?.workTypeId);
  const workTypeOptions = selectableWorkTypes.map((w) => ({ value: w.id, label: w.name }));
  const fallbackWorkTypeId = selectableWorkTypes.find((w) => w.isFallback)?.id;
  const selectableSources = leadSources.filter((s) => s.active || s.id === lead?.sourceId);
  const sourceOptions = selectableSources.map((s) => ({ value: s.id, label: s.name }));
  const fallbackSourceId = selectableSources.find((s) => s.isFallback)?.id;

  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup>
          <Label htmlFor="companyName">Company name</Label>
          <Input
            id="companyName"
            name="companyName"
            required
            defaultValue={lead?.companyName}
            placeholder="Acme Inc."
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="contactName">Contact name</Label>
          <Input
            id="contactName"
            name="contactName"
            defaultValue={lead?.contactName ?? ""}
            placeholder="Jane Doe"
          />
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
        <SelectWithOther
          label="Work type / service interested in"
          name="workTypeId"
          otherName="workTypeOther"
          options={workTypeOptions}
          defaultValue={lead?.workTypeId}
          defaultOtherValue={lead?.workTypeOther}
          otherValue={fallbackWorkTypeId}
        />
        <SelectWithOther
          label="Lead source"
          name="sourceId"
          otherName="sourceOther"
          options={sourceOptions}
          defaultValue={lead?.sourceId}
          defaultOtherValue={lead?.sourceOther}
          otherValue={fallbackSourceId}
        />
      </div>
      <SubmitButton label={submitLabel} />
    </form>
  );
}
