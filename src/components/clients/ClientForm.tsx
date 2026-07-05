"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  User,
  Mail,
  Phone,
  Briefcase,
  Activity,
  DollarSign,
  Calendar,
  Clock,
  List,
  ArrowRight,
} from "lucide-react";
import { Input, Label, Select, FieldGroup } from "@/components/ui/Field";
import { SelectWithOther } from "@/components/ui/SelectWithOther";
import { Button } from "@/components/ui/Button";
import type { Client, ClientStatus, ClientType, WorkType } from "@/lib/types";
import { formatDateInput } from "@/lib/format";
import { createClient, updateClient } from "@/app/(app)/clients/actions";

function SubmitButton({ label, compact }: { label: string; compact: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size={compact ? "sm" : "md"} disabled={pending}>
      {pending ? "Saving…" : label}
      {!pending && !compact && <ArrowRight size={16} />}
    </Button>
  );
}

export function ClientForm({
  client,
  workTypes,
  submitLabel = "Save client",
  cancelHref,
  variant = "full",
}: {
  client?: Client;
  workTypes: WorkType[];
  submitLabel?: string;
  cancelHref?: string;
  /** "compact" drops the icons/uppercase labels/required-asterisks for the in-place edit panel on the client detail page; "full" (default) is the fuller treatment used by the standalone New Client page. */
  variant?: "full" | "compact";
}) {
  const [type, setType] = useState<ClientType>(client?.type ?? "PROJECT");
  const selectableWorkTypes = workTypes.filter((w) => w.active || w.id === client?.workTypeId);
  const workTypeOptions = selectableWorkTypes.map((w) => ({ value: w.id, label: w.name }));
  const fallbackWorkTypeId = selectableWorkTypes.find((w) => w.isFallback)?.id;

  const action = client?.id ? updateClient.bind(null, client.id) : createClient;
  const compact = variant === "compact";
  const fieldIcon = (icon: LucideIcon) => (compact ? undefined : icon);

  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup>
          <Label htmlFor="companyName" required={!compact} compact={compact}>
            Company name
          </Label>
          <Input
            id="companyName"
            name="companyName"
            required
            defaultValue={client?.companyName}
            placeholder="e.g. Acme Inc."
            icon={fieldIcon(Building2)}
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="contactName" required={!compact} compact={compact}>
            Contact name
          </Label>
          <Input
            id="contactName"
            name="contactName"
            defaultValue={client?.contactName ?? ""}
            placeholder="e.g. Jane Doe"
            icon={fieldIcon(User)}
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="contactEmail" required={!compact} compact={compact}>
            Email
          </Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={client?.contactEmail ?? ""}
            placeholder="e.g. jane@acme.com"
            icon={fieldIcon(Mail)}
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="contactPhone" compact={compact}>
            Phone
          </Label>
          <Input
            id="contactPhone"
            name="contactPhone"
            defaultValue={client?.contactPhone ?? ""}
            placeholder="e.g. (555) 555-5555"
            icon={fieldIcon(Phone)}
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="type" required={!compact} compact={compact}>
            Type
          </Label>
          <Select
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as ClientType)}
            icon={fieldIcon(Briefcase)}
          >
            <option value="PROJECT">Project-based</option>
            <option value="RECURRING">Recurring (monthly)</option>
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="status" required={!compact} compact={compact}>
            Status
          </Label>
          <Select
            id="status"
            name="status"
            defaultValue={client?.status ?? ("ACTIVE" as ClientStatus)}
            icon={fieldIcon(Activity)}
          >
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="CHURNED">Archived</option>
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="rate" compact={compact}>
            {type === "RECURRING" ? "Monthly fee ($)" : "Project total ($)"}
          </Label>
          <Input
            id="rate"
            name="rate"
            type="number"
            step="0.01"
            min="0"
            defaultValue={client?.rate ?? ""}
            placeholder="e.g. 0.00"
            icon={fieldIcon(DollarSign)}
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="startDate" compact={compact}>
            Start date
          </Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={formatDateInput(client?.startDate)}
            icon={fieldIcon(Calendar)}
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="budgetedHours" compact={compact}>
            Budgeted hours (optional)
          </Label>
          <Input
            id="budgetedHours"
            name="budgetedHours"
            type="number"
            step="0.5"
            min="0"
            defaultValue={client?.budgetedHours ?? ""}
            placeholder="e.g. 40"
            icon={fieldIcon(Clock)}
          />
        </FieldGroup>
        <SelectWithOther
          label="Work type"
          name="workTypeId"
          otherName="workTypeOther"
          options={workTypeOptions}
          defaultValue={client?.workTypeId}
          defaultOtherValue={client?.workTypeOther}
          otherValue={fallbackWorkTypeId}
          icon={fieldIcon(List)}
          compact={compact}
        />
      </div>
      {compact ? (
        <SubmitButton label={submitLabel} compact />
      ) : (
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
          <SubmitButton label={submitLabel} compact={false} />
        </div>
      )}
    </form>
  );
}
