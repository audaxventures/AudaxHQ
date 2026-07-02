"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Input, Label, Select, FieldGroup } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { Client, ClientStatus, ClientType } from "@/lib/types";
import { formatDateInput } from "@/lib/format";
import { createClient, updateClient } from "@/app/(app)/clients/actions";

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
  fromLeadId,
}: {
  client?: Client;
  submitLabel?: string;
  fromLeadId?: string;
}) {
  const [type, setType] = useState<ClientType>(client?.type ?? "PROJECT");

  const action = client?.id
    ? updateClient.bind(null, client.id)
    : createClient;

  return (
    <form action={action} className="space-y-5">
      {fromLeadId && <input type="hidden" name="fromLeadId" value={fromLeadId} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required defaultValue={client?.name} placeholder="Jane Doe" />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="company">Company</Label>
          <Input id="company" name="company" defaultValue={client?.company ?? ""} placeholder="Acme Inc." />
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
            <option value="CHURNED">Churned</option>
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
      </div>
      <SubmitButton label={submitLabel} />
    </form>
  );
}
