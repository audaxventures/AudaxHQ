"use client";

import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Building2, User, Mail, Phone, Target, DollarSign, List, Megaphone, ArrowRight } from "lucide-react";
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
      {!pending && <ArrowRight size={16} />}
    </Button>
  );
}

export function LeadForm({
  lead,
  workTypes,
  leadSources,
  submitLabel = "Save lead",
  cancelHref,
}: {
  lead?: Lead;
  workTypes: WorkType[];
  leadSources: LeadSource[];
  submitLabel?: string;
  cancelHref?: string;
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
          <Label htmlFor="companyName" required>
            Company name
          </Label>
          <Input
            id="companyName"
            name="companyName"
            required
            defaultValue={lead?.companyName}
            placeholder="e.g. Acme Inc."
            icon={Building2}
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="contactName" required>
            Contact name
          </Label>
          <Input
            id="contactName"
            name="contactName"
            defaultValue={lead?.contactName ?? ""}
            placeholder="e.g. Jane Doe"
            icon={User}
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="contactEmail" required>
            Email
          </Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={lead?.contactEmail ?? ""}
            placeholder="e.g. jane@acme.com"
            icon={Mail}
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="contactPhone">Phone</Label>
          <Input
            id="contactPhone"
            name="contactPhone"
            defaultValue={lead?.contactPhone ?? ""}
            placeholder="e.g. (555) 555-5555"
            icon={Phone}
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="status" required>
            Status
          </Label>
          <Select id="status" name="status" defaultValue={lead?.status ?? "NEW"} icon={Target}>
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
            placeholder="e.g. 0.00"
            icon={DollarSign}
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
          icon={List}
        />
        <SelectWithOther
          label="Lead source"
          name="sourceId"
          otherName="sourceOther"
          options={sourceOptions}
          defaultValue={lead?.sourceId}
          defaultOtherValue={lead?.sourceOther}
          otherValue={fallbackSourceId}
          icon={Megaphone}
        />
      </div>
      <div className="flex items-center justify-between border-t border-navy-100 pt-5">
        {cancelHref ? (
          <Link
            href={cancelHref}
            className="text-sm font-medium text-navy-500 transition-colors hover:text-navy-800"
          >
            Cancel
          </Link>
        ) : (
          <span />
        )}
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
