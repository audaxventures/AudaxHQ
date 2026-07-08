"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { signup, type SignupState } from "@/app/signup/actions";
import { listTimezones, DEFAULT_TIMEZONE } from "@/lib/timezone";

const initialState: SignupState = { error: null };

const inputClasses =
  "w-full rounded-xl border border-navy-700 bg-navy-900/60 px-4 py-3 text-cream-50 placeholder:text-navy-500 focus:outline-none focus:border-burnt-400 focus:ring-2 focus:ring-burnt-500/20";
const labelClasses = "block text-xs font-medium uppercase tracking-wide text-navy-300 mb-2";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-burnt-500 px-4 py-3.5 text-base font-semibold text-cream-50 transition-colors hover:bg-burnt-600 disabled:opacity-50"
    >
      {pending ? "Creating workspace…" : "Create workspace"}
    </button>
  );
}

export function SignupForm() {
  const [state, formAction] = useActionState(signup, initialState);
  let detectedTimezone = DEFAULT_TIMEZONE;
  try {
    detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
  } catch {
    // Fall back to UTC if the runtime can't resolve one.
  }
  const timezones = listTimezones();

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="businessName" className={labelClasses}>
          Business name
        </label>
        <input
          id="businessName"
          name="businessName"
          type="text"
          required
          autoFocus
          autoComplete="organization"
          className={inputClasses}
          placeholder="Acme Consulting"
        />
      </div>
      <div>
        <label htmlFor="ownerName" className={labelClasses}>
          Your name
        </label>
        <input
          id="ownerName"
          name="ownerName"
          type="text"
          required
          autoComplete="name"
          className={inputClasses}
          placeholder="Jane Doe"
        />
      </div>
      <div>
        <label htmlFor="ownerEmail" className={labelClasses}>
          Email
        </label>
        <input
          id="ownerEmail"
          name="ownerEmail"
          type="email"
          required
          autoComplete="email"
          className={inputClasses}
          placeholder="jane@acmeconsulting.com"
        />
      </div>
      <div>
        <label htmlFor="passcode" className={labelClasses}>
          Passcode
        </label>
        <input
          id="passcode"
          name="passcode"
          type="password"
          required
          autoComplete="new-password"
          className={inputClasses}
          placeholder="••••••••"
        />
      </div>
      <div>
        <label htmlFor="confirmPasscode" className={labelClasses}>
          Confirm passcode
        </label>
        <input
          id="confirmPasscode"
          name="confirmPasscode"
          type="password"
          required
          autoComplete="new-password"
          className={inputClasses}
          placeholder="••••••••"
        />
      </div>
      <div>
        <label htmlFor="timezone" className={labelClasses}>
          Timezone
        </label>
        <select id="timezone" name="timezone" defaultValue={detectedTimezone} className={inputClasses}>
          {timezones.map((tz) => (
            <option key={tz} value={tz} className="bg-navy-900">
              {tz.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
      {state.error && (
        <p className="text-sm text-brick-100" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton />
      <p className="text-center text-sm text-navy-300">
        Already have a workspace?{" "}
        <Link href="/login" className="font-medium text-burnt-400 hover:text-burnt-300">
          Sign in
        </Link>
      </p>
    </form>
  );
}
