"use client";

import { useState, useTransition } from "react";
import { Input, Label, FieldGroup } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { Business } from "@/lib/types";
import { updateBusinessName } from "@/app/(app)/settings/actions";

export function BusinessNameForm({ business }: { business: Business }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={(formData) => {
        setSaved(false);
        startTransition(async () => {
          await updateBusinessName(formData);
          setSaved(true);
        });
      }}
      className="max-w-md space-y-4"
    >
      <FieldGroup>
        <Label htmlFor="business-name" required>
          Business name
        </Label>
        <Input id="business-name" name="name" required defaultValue={business.name} placeholder="Acme Consulting" />
      </FieldGroup>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {saved && !pending && <p className="text-sm text-sage-600">Saved.</p>}
      </div>
    </form>
  );
}
