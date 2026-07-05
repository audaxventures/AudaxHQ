"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Select, Input, Label, FieldGroup } from "@/components/ui/Field";

export function SelectWithOther({
  label,
  name,
  otherName,
  options,
  defaultValue,
  defaultOtherValue,
  otherValue = "OTHER",
  otherPlaceholder = "Please specify",
  icon,
  compact,
}: {
  label: string;
  name: string;
  otherName: string;
  options: { value: string; label: string }[];
  defaultValue?: string | null;
  defaultOtherValue?: string | null;
  /** The option value that reveals the free-text field — defaults to the literal "OTHER" for fixed enums, but callers backed by a DB lookup table pass the id of whichever row is flagged as the fallback. */
  otherValue?: string;
  otherPlaceholder?: string;
  icon?: LucideIcon;
  compact?: boolean;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  return (
    <FieldGroup>
      <Label htmlFor={name} compact={compact}>
        {label}
      </Label>
      <Select id={name} name={name} value={value} onChange={(e) => setValue(e.target.value)} icon={icon}>
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      {value === otherValue && (
        <Input
          name={otherName}
          placeholder={otherPlaceholder}
          defaultValue={defaultOtherValue ?? ""}
          className="mt-2"
        />
      )}
    </FieldGroup>
  );
}
