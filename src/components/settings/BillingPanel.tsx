"use client";

import { useState, useTransition } from "react";
import { Check, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { PRICING_TIERS, priceForInterval } from "@/lib/pricing";
import { startSubscriptionCheckout, openBillingPortal } from "@/app/(app)/settings/actions";
import type { BillingInterval, Business, BusinessTier } from "@/lib/types";

const STATUS_TONE = {
  trialing: "gold",
  active: "sage",
  past_due: "brick",
  canceled: "slate",
} as const;

const STATUS_LABEL = {
  trialing: "Trial",
  active: "Active",
  past_due: "Payment failed",
  canceled: "Canceled",
} as const;

function daysUntil(dateIso: string): number {
  const ms = new Date(dateIso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

/** Plan-selection UI shared by "never checked out" and "start a fresh subscription" — same shape as the signup form's picker, just wired to a server action instead of a hidden form field. */
function PlanPicker({ onStart, pending }: { onStart: (tier: BusinessTier, interval: BillingInterval) => void; pending: boolean }) {
  const [tier, setTier] = useState<BusinessTier>("growth");
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  return (
    <div>
      <div className="mb-3 flex items-center gap-1 rounded-xl border border-navy-200 bg-cream-100 p-1">
        {(["monthly", "annual"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setInterval(opt)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              interval === opt ? "bg-navy-900 text-cream-50" : "text-navy-500 hover:text-navy-800"
            )}
          >
            {opt === "monthly" ? "Monthly" : "Annual"}
            {opt === "annual" && (
              <span className="rounded-full bg-sage-100 px-1.5 py-0.5 text-[10px] font-bold text-sage-700">
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
              onClick={() => setTier(info.tier)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                selected ? "border-burnt-400 bg-burnt-50" : "border-navy-100 bg-white hover:border-navy-300"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                    selected ? "border-burnt-500 bg-burnt-500" : "border-navy-300"
                  )}
                >
                  {selected && <Check size={12} className="text-cream-50" strokeWidth={3} />}
                </span>
                <div>
                  <p className="text-sm font-semibold text-navy-900">{info.name}</p>
                  <p className="text-xs text-navy-500">{info.audience}</p>
                </div>
              </div>
              <p className="shrink-0 text-sm font-semibold text-navy-900">
                ${priceForInterval(info, interval)}
                <span className="text-xs font-normal text-navy-400">/mo</span>
              </p>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => onStart(tier, interval)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 py-3 text-sm font-semibold text-cream-50 transition-colors hover:bg-navy-800 disabled:opacity-50"
      >
        <CreditCard size={16} /> {pending ? "Redirecting…" : "Continue to payment"}
      </button>
    </div>
  );
}

export function BillingPanel({ business, checkoutParam }: { business: Business; checkoutParam?: string }) {
  const [pending, startTransition] = useTransition();

  function handleStart(tier: BusinessTier, interval: BillingInterval) {
    startTransition(async () => {
      await startSubscriptionCheckout(tier, interval);
    });
  }

  function handlePortal() {
    startTransition(async () => {
      await openBillingPortal();
    });
  }

  // No status yet means Checkout was never completed (a fresh signup that
  // bailed, or a workspace whose customer record predates Stripe billing).
  if (!business.subscriptionStatus) {
    return (
      <div>
        {checkoutParam === "canceled" && (
          <p className="mb-4 rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 text-sm text-gold-800">
            Checkout was canceled — pick a plan below whenever you&rsquo;re ready.
          </p>
        )}
        <p className="mb-4 text-sm text-navy-500">
          Choose a plan to start your 7-day free trial. You won&rsquo;t be charged until the trial ends.
        </p>
        <PlanPicker onStart={handleStart} pending={pending} />
      </div>
    );
  }

  const tierInfo = PRICING_TIERS.find((t) => t.tier === business.tier);
  const status = business.subscriptionStatus;
  // Backfilled by migration 042 (existing/early-access workspaces set to
  // 'active' with no Stripe customer) or a workspace comped by a platform
  // admin — either way there's no Stripe subscription to open a portal
  // session for, so "Manage billing" would just error.
  const isComplimentary = !business.stripeCustomerId;

  return (
    <div className="space-y-5">
      {checkoutParam === "success" && (
        <p className="rounded-xl border border-sage-200 bg-sage-50 px-4 py-3 text-sm text-sage-800">
          You&rsquo;re all set — your trial has started.
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy-100 bg-cream-50 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-heading text-lg font-medium text-navy-900">{tierInfo?.name ?? business.tier}</p>
            <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
          </div>
          <p className="mt-1 text-sm text-navy-500">
            {isComplimentary
              ? "Complimentary access — no payment required"
              : `${business.billingInterval === "annual" ? "Billed annually" : "Billed monthly"}${
                  tierInfo ? ` · $${priceForInterval(tierInfo, business.billingInterval ?? "monthly")}/mo` : ""
                }`}
          </p>
        </div>
        {status === "trialing" && business.trialEndsAt && (
          <p className="text-sm font-medium text-gold-700">
            {daysUntil(business.trialEndsAt)} day{daysUntil(business.trialEndsAt) === 1 ? "" : "s"} left in trial ·
            first charge {formatDate(business.trialEndsAt)}
          </p>
        )}
        {status === "past_due" && (
          <p className="text-sm font-medium text-brick-600">Your last payment failed — update your card to keep access.</p>
        )}
      </div>

      {isComplimentary ? (
        <p className="text-xs text-navy-400">
          Your workspace has complimentary access set up by Verclara — there&rsquo;s no card on file and nothing to
          manage here.
        </p>
      ) : (
        <>
          <button
            type="button"
            disabled={pending}
            onClick={handlePortal}
            className="flex items-center justify-center gap-2 rounded-xl border border-navy-200 px-4 py-2.5 text-sm font-medium text-navy-700 transition-colors hover:border-navy-400 hover:bg-navy-100/50 disabled:opacity-50"
          >
            <CreditCard size={16} /> {pending ? "Redirecting…" : "Manage billing"}
          </button>
          <p className="text-xs text-navy-400">
            Manage billing opens Stripe&rsquo;s secure portal — update your card, switch plans, or cancel.
          </p>
        </>
      )}
    </div>
  );
}
