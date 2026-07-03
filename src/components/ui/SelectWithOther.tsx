"use client";

import { useState } from "react";
import { Select, Input, Label, FieldGroup } from "@/components/ui/Field";

export function SelectWithOther({
  label,
  name,
  otherName,
  options,
  defaultValue,
  defaultOtherValue,
  otherPlaceholder = "Please specify",
}: {
  label: string;
  name: string;
  otherName: string;
  options: { value: string; label: string }[];
  defaultValue?: string | null;
  defaultOtherValue?: string | null;
  otherPlaceholder?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  return (
    <FieldGroup>
      <Label htmlFor={name}>{label}</Label>
      <Select id={name} name={name} value={value} onChange={(e) => setValue(e.target.value)}>
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      {value === "OTHER" && (
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
