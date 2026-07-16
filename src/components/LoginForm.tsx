"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { login, type LoginState } from "@/app/login/actions";

const initialState: LoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-burnt-500 px-4 py-3.5 text-base font-semibold text-cream-50 transition-colors hover:bg-burnt-600 disabled:opacity-50"
    >
      {pending ? "Checking…" : "Sign In"}
    </button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label
          htmlFor="email"
          className="block text-xs font-medium uppercase tracking-wide text-navy-300 mb-2"
        >
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
      <div>
        <label
          htmlFor="passcode"
          className="block text-xs font-medium uppercase tracking-wide text-navy-300 mb-2"
        >
          Passcode
        </label>
        <input
          id="passcode"
          name="passcode"
          type="password"
          required
          autoComplete="off"
          className="w-full rounded-xl border border-navy-700 bg-navy-900/60 px-4 py-3 text-cream-50 placeholder:text-navy-500 focus:outline-none focus:border-burnt-400 focus:ring-2 focus:ring-burnt-500/20"
          placeholder="••••••••"
        />
        <div className="mt-2 text-right">
          <Link href="/login/forgot" className="text-xs font-medium text-navy-300 hover:text-burnt-400">
            Forgot passcode?
          </Link>
        </div>
      </div>
      {state.error && (
        <p className="text-sm text-brick-100" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton />
      <p className="text-center text-sm text-navy-300">
        New to Verclara?{" "}
        <Link href="/signup" className="font-medium text-burnt-400 hover:text-burnt-300">
          Create a workspace
        </Link>
      </p>
    </form>
  );
}
