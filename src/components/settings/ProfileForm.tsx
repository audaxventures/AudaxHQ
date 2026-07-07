"use client";

import { useState, useTransition } from "react";
import { Input, Label, FieldGroup, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { Business } from "@/lib/types";
import { updateProfile } from "@/app/(app)/settings/actions";
import { listTimezones } from "@/lib/timezone";

const TIMEZONES = listTimezones();

export function ProfileForm({ business }: { business: Business }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={(formData) => {
        setSaved(false);
        startTransition(async () => {
          await updateProfile(formData);
          setSaved(true);
        });
      }}
      className="max-w-md space-y-4"
    >
      <FieldGroup>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={business.ownerName} placeholder="Jane Doe" />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="email" required>Email</Label>
        <Input id="email" name="email" type="email" required defaultValue={business.ownerEmail} placeholder="jane@audaxventures.ca" />
        <p className="mt-1.5 text-xs text-navy-400">Required to sign in, along with your passcode.</p>
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="timezone">Timezone</Label>
        <Select id="timezone" name="timezone" defaultValue={business.timezone}>
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
        <p className="mt-1.5 text-xs text-navy-400">
          Used to work out &ldquo;today&rdquo; for overdue tasks, follow-ups, and the calendar.
        </p>
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
