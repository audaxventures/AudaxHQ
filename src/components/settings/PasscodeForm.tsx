"use client";

import { useRef, useState, useTransition } from "react";
import { fieldBase, Label, FieldGroup } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { changePasscode } from "@/app/(app)/settings/actions";

const passwordIconClassName = "text-navy-400 hover:text-navy-600";

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
        <Label htmlFor="currentPasscode">Current password</Label>
        <PasswordInput
          id="currentPasscode"
          name="currentPasscode"
          required
          autoComplete="current-password"
          className={fieldBase}
          iconClassName={passwordIconClassName}
        />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="newPasscode">New password</Label>
        <PasswordInput
          id="newPasscode"
          name="newPasscode"
          required
          autoComplete="new-password"
          minLength={4}
          className={fieldBase}
          iconClassName={passwordIconClassName}
        />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="confirmPasscode">Confirm new password</Label>
        <PasswordInput
          id="confirmPasscode"
          name="confirmPasscode"
          required
          autoComplete="new-password"
          minLength={4}
          className={fieldBase}
          iconClassName={passwordIconClassName}
        />
      </FieldGroup>
      {error && <p className="text-sm text-brick-600">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Updating…" : "Update password"}
        </Button>
        {saved && !pending && <p className="text-sm text-sage-600">Password updated.</p>}
      </div>
    </form>
  );
}
