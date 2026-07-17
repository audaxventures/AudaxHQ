"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { appPath } from "@/lib/site";

export type PricingTier = {
  name: string;
  audience: string;
  highlight: boolean;
  monthly: number;
  annualMonthly: number;
  annualTotal: number;
  features: string[];
};

export function PricingTiers({ tiers }: { tiers: PricingTier[] }) {
  const [annual, setAnnual] = useState(false);

  return (
    <div>
      <div className="mx-auto flex w-fit items-center gap-1 rounded-full border border-navy-200 bg-white p-1">
        <button
          type="button"
          onClick={() => setAnnual(false)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            !annual ? "bg-navy-900 text-cream-50" : "text-navy-500 hover:text-navy-800"
          )}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setAnnual(true)}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            annual ? "bg-navy-900 text-cream-50" : "text-navy-500 hover:text-navy-800"
          )}
        >
          Annual
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
              annual ? "bg-burnt-500 text-cream-50" : "bg-sage-100 text-sage-700"
            )}
          >
            2 months free
          </span>
        </button>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {tiers.map((tier) => {
          const price = annual ? tier.annualMonthly : tier.monthly;
          return (
            <div
              key={tier.name}
              className={cn(
                "rounded-2xl border p-7",
                tier.highlight ? "border-burnt-300 bg-white shadow-lg ring-1 ring-burnt-200" : "border-navy-100 bg-white"
              )}
            >
              {tier.highlight && (
                <span className="inline-flex items-center rounded-full bg-burnt-100 px-2.5 py-0.5 text-[11px] font-semibold text-burnt-600">
                  Most popular
                </span>
              )}
              <h2 className="mt-3 font-heading text-xl font-semibold text-navy-900">{tier.name}</h2>
              <p className="mt-1 text-sm text-navy-400">{tier.audience}</p>

              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="font-heading text-3xl font-semibold text-navy-900">${price}</span>
                <span className="text-sm text-navy-400">/mo</span>
              </div>
              {annual && <p className="mt-1 text-xs text-navy-400">Billed annually at ${tier.annualTotal}/yr</p>}
              <p className="mt-1 text-xs font-medium text-sage-700">Future price — free during early access</p>

              <ul className="mt-6 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-navy-600">
                    <Check size={16} className="mt-0.5 shrink-0 text-sage-600" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={appPath("/signup")}
                className={cn(
                  "mt-7 flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                  tier.highlight
                    ? "bg-burnt-500 text-cream-50 hover:bg-burnt-400"
                    : "border border-navy-200 text-navy-800 hover:border-navy-400 hover:bg-navy-100/50"
                )}
              >
                Start for free
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
