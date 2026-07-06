"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { resetPasscode, type ResetPasscodeState } from "@/app/login/actions";

const initialState: ResetPasscodeState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-burnt-500 px-4 py-3.5 text-base font-semibold text-cream-50 transition-colors hover:bg-burnt-600 disabled:opacity-50"
    >
      {pending ? "Saving…" : "Set new passcode"}
    </button>
  );
}

export function ResetPasscodeForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasscode, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label htmlFor="newPasscode" className="block text-xs font-medium uppercase tracking-wide text-navy-300 mb-2">
          New passcode
        </label>
        <input
          id="newPasscode"
          name="newPasscode"
          type="password"
          required
          autoFocus
          autoComplete="new-password"
          className="w-full rounded-xl border border-navy-700 bg-navy-900/60 px-4 py-3 text-cream-50 placeholder:text-navy-500 focus:outline-none focus:border-burnt-400 focus:ring-2 focus:ring-burnt-500/20"
          placeholder="••••••••"
        />
      </div>
      <div>
        <label
          htmlFor="confirmPasscode"
          className="block text-xs font-medium uppercase tracking-wide text-navy-300 mb-2"
        >
          Confirm new passcode
        </label>
        <input
          id="confirmPasscode"
          name="confirmPasscode"
          type="password"
          required
          autoComplete="new-password"
          className="w-full rounded-xl border border-navy-700 bg-navy-900/60 px-4 py-3 text-cream-50 placeholder:text-navy-500 focus:outline-none focus:border-burnt-400 focus:ring-2 focus:ring-burnt-500/20"
          placeholder="••••••••"
        />
      </div>
      {state.error && (
        <p className="text-sm text-brick-100" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
