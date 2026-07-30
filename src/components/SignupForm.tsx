"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Check } from "lucide-react";
import { signup, type SignupState } from "@/app/signup/actions";
import { listTimezones, DEFAULT_TIMEZONE } from "@/lib/timezone";
import { PRICING_TIERS, priceForInterval } from "@/lib/pricing";
import { cn } from "@/lib/cn";
import type { BillingInterval, BusinessTier } from "@/lib/types";

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
      {pending ? "Starting your trial…" : "Start 7-day free trial"}
    </button>
  );
}

function PlanPicker({
  tier,
  onTierChange,
  interval,
  onIntervalChange,
}: {
  tier: BusinessTier;
  onTierChange: (tier: BusinessTier) => void;
  interval: BillingInterval;
  onIntervalChange: (interval: BillingInterval) => void;
}) {
  return (
    <div>
      <div className={labelClasses}>Plan</div>
      <div className="mb-3 flex items-center gap-1 rounded-xl border border-navy-700 bg-navy-900/60 p-1">
        {(["monthly", "annual"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onIntervalChange(opt)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              interval === opt ? "bg-burnt-500 text-cream-50" : "text-navy-300 hover:text-cream-100"
            )}
          >
            {opt === "monthly" ? "Monthly" : "Annual"}
            {opt === "annual" && (
              <span className="rounded-full bg-sage-500/20 px-1.5 py-0.5 text-[10px] font-bold text-sage-300">
                2 mo free
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {PRICING_TIERS.map((info) => {
          const selected = info.tier === tier;
          return (
            <button
              key={info.tier}
              type="button"
              onClick={() => onTierChange(info.tier)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                selected
                  ? "border-burnt-400 bg-burnt-500/10"
                  : "border-navy-700 bg-navy-900/40 hover:border-navy-600"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                    selected ? "border-burnt-400 bg-burnt-500" : "border-navy-600"
                  )}
                >
                  {selected && <Check size={12} className="text-cream-50" strokeWidth={3} />}
                </span>
                <div>
                  <p className="text-sm font-semibold text-cream-50">
                    {info.name}
                    {info.highlight && (
                      <span className="ml-2 rounded-full bg-burnt-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-burnt-300">
                        Popular
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-navy-400">{info.audience}</p>
                </div>
              </div>
              <p className="shrink-0 text-sm font-semibold text-cream-50">
                ${priceForInterval(info, interval)}
                <span className="text-xs font-normal text-navy-400">CAD/mo</span>
              </p>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-navy-400">
        7 days free, then billed {interval === "annual" ? "annually" : "monthly"}. Cancel anytime before the trial
        ends and you won&rsquo;t be charged.
      </p>
    </div>
  );
}

export function SignupForm({
  initialTier = "growth",
  initialInterval = "monthly",
}: {
  initialTier?: BusinessTier;
  initialInterval?: BillingInterval;
}) {
  const [state, formAction] = useActionState(signup, initialState);
  const [tier, setTier] = useState<BusinessTier>(initialTier);
  const [interval, setInterval] = useState<BillingInterval>(initialInterval);
  let detectedTimezone = DEFAULT_TIMEZONE;
  try {
    detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
  } catch {
    // Fall back to UTC if the runtime can't resolve one.
  }
  const timezones = listTimezones();

  return (
    <form action={formAction} className="space-y-4">
      <PlanPicker tier={tier} onTierChange={setTier} interval={interval} onIntervalChange={setInterval} />
      <input type="hidden" name="tier" value={tier} />
      <input type="hidden" name="interval" value={interval} />
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
      <p className="text-center text-xs text-navy-400">You&rsquo;ll enter payment details on the next step.</p>
      <p className="text-center text-sm text-navy-300">
        Already have a workspace?{" "}
        <Link href="/login" className="font-medium text-burnt-400 hover:text-burnt-300">
          Sign in
        </Link>
      </p>
    </form>
  );
}
