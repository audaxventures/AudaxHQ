"use client";

import { useRef, useState, useTransition } from "react";
import { Input, Label, FieldGroup } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { changePasscode } from "@/app/(app)/settings/actions";

export function PasscodeForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(formData) => {
        setError(null);
        setSaved(false);
        startTransition(async () => {
          const result = await changePasscode(formData);
          if (result.error) {
            setError(result.error);
          } else {
            setSaved(true);
            formRef.current?.reset();
          }
        });
      }}
      className="max-w-sm space-y-4"
    >
      <FieldGroup>
        <Label htmlFor="currentPasscode">Current passcode</Label>
        <Input id="currentPasscode" name="currentPasscode" type="password" required autoComplete="current-password" />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="newPasscode">New passcode</Label>
        <Input id="newPasscode" name="newPasscode" type="password" required autoComplete="new-password" minLength={4} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="confirmPasscode">Confirm new passcode</Label>
        <Input
          id="confirmPasscode"
          name="confirmPasscode"
          type="password"
          required
          autoComplete="new-password"
          minLength={4}
        />
      </FieldGroup>
      {error && <p className="text-sm text-brick-600">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Updating…" : "Update passcode"}
        </Button>
        {saved && !pending && <p className="text-sm text-sage-600">Passcode updated.</p>}
      </div>
    </form>
  );
}
