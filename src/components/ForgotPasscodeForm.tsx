"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { requestPasscodeReset, type ForgotPasscodeState } from "@/app/login/actions";

const initialState: ForgotPasscodeState = { message: null, error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-burnt-500 px-4 py-3.5 text-base font-semibold text-cream-50 transition-colors hover:bg-burnt-600 disabled:opacity-50"
    >
      {pending ? "Sending…" : "Send reset link"}
    </button>
  );
}

export function ForgotPasscodeForm() {
  const [state, formAction] = useActionState(requestPasscodeReset, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wide text-navy-300 mb-2">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoFocus
          autoComplete="email"
          className="w-full rounded-xl border border-navy-700 bg-navy-900/60 px-4 py-3 text-cream-50 placeholder:text-navy-500 focus:outline-none focus:border-burnt-400 focus:ring-2 focus:ring-burnt-500/20"
          placeholder="jane@audaxventures.ca"
        />
      </div>
      {state.message && (
        <p className="text-sm text-sage-100" role="status">
          {state.message}
        </p>
      )}
      {state.error && (
        <p className="text-sm text-brick-100" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton />
      <p className="text-center text-sm text-navy-300">
        <Link href="/login" className="font-medium text-burnt-400 hover:text-burnt-300">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
