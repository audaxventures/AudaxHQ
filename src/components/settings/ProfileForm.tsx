"use client";

import { useState, useTransition } from "react";
import { Input, Label, FieldGroup } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { Profile } from "@/lib/types";
import { updateProfile } from "@/app/(app)/settings/actions";

export function ProfileForm({ profile }: { profile: Profile }) {
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
        <Input id="name" name="name" defaultValue={profile.name} placeholder="Jane Doe" />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={profile.email} placeholder="jane@audaxventures.ca" />
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
