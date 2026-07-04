"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Input, Label, Select, FieldGroup } from "@/components/ui/Field";
import { SelectWithOther } from "@/components/ui/SelectWithOther";
import { Button } from "@/components/ui/Button";
import type { Client, ClientStatus, ClientType } from "@/lib/types";
import { WORK_TYPE_LABELS, WORK_TYPE_ORDER } from "@/lib/types";
import { formatDateInput } from "@/lib/format";
import { createClient, updateClient } from "@/app/(app)/clients/actions";

const WORK_TYPE_OPTIONS = WORK_TYPE_ORDER.map((v) => ({ value: v, label: WORK_TYPE_LABELS[v] }));

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function ClientForm({
  client,
  submitLabel = "Save client",
}: {
  client?: Client;
  submitLabel?: string;
}) {
  const [type, setType] = useState<ClientType>(client?.type ?? "PROJECT");

  const action = client?.id ? updateClient.bind(null, client.id) : createClient;

  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup>
          <Label htmlFor="companyName">Company name</Label>
          <Input
            id="companyName"
            name="companyName"
            required
            defaultValue={client?.companyName}
            placeholder="Acme Inc."
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="contactName">Contact name</Label>
          <Input
            id="contactName"
            name="contactName"
            defaultValue={client?.contactName ?? ""}
            placeholder="Jane Doe"
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="contactEmail">Email</Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={client?.contactEmail ?? ""}
            placeholder="jane@acme.com"
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="contactPhone">Phone</Label>
          <Input id="contactPhone" name="contactPhone" defaultValue={client?.contactPhone ?? ""} placeholder="(555) 555-5555" />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="type">Type</Label>
          <Select
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as ClientType)}
          >
            <option value="PROJECT">Project-based</option>
            <option value="RECURRING">Recurring (monthly)</option>
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={client?.status ?? ("ACTIVE" as ClientStatus)}>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="CHURNED">Archived</option>
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="rate">{type === "RECURRING" ? "Monthly fee ($)" : "Project total ($)"}</Label>
          <Input
            id="rate"
            name="rate"
            type="number"
            step="0.01"
            min="0"
            defaultValue={client?.rate ?? ""}
            placeholder="0.00"
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" name="startDate" type="date" defaultValue={formatDateInput(client?.startDate)} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="budgetedHours">Budgeted hours (optional)</Label>
          <Input
            id="budgetedHours"
            name="budgetedHours"
            type="number"
            step="0.5"
            min="0"
            defaultValue={client?.budgetedHours ?? ""}
            placeholder="e.g. 40"
          />
        </FieldGroup>
        <SelectWithOther
          label="Work type"
          name="workType"
          otherName="workTypeOther"
          options={WORK_TYPE_OPTIONS}
          defaultValue={client?.workType}
          defaultOtherValue={client?.workTypeOther}
        />
      </div>
      <SubmitButton label={submitLabel} />
    </form>
  );
}
