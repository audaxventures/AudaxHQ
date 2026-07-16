import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Section } from "@/components/site/Section";
import { cn } from "@/lib/cn";
import { appPath } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing — Audax HQ",
  description: "Audax HQ is free during early access. Here's the plan structure we're building toward.",
};

const TIERS = [
  {
    name: "Starter",
    audience: "For solo operators",
    highlight: false,
    features: [
      "Unlimited clients & leads",
      "Pipeline & revenue tracking",
      "Meeting notes, time tracking & tasks",
      "Data export, anytime",
    ],
  },
  {
    name: "Growth",
    audience: "For small teams",
    highlight: true,
    features: [
      "Everything in Starter",
      "Add team members",
      "Per-client access control",
      "Assign and hand off tasks across your team",
    ],
  },
  {
    name: "Scale",
    audience: "For growing agencies",
    highlight: false,
    features: ["Everything in Growth", "Priority support", "Early access to new features"],
  },
];

export default function PricingPage() {
  return (
    <>
      <div className="bg-navy-900">
        <Section className="py-20 text-center lg:py-24">
          <span className="inline-flex items-center rounded-full border border-navy-700 bg-navy-800 px-3.5 py-1.5 text-xs font-medium text-navy-200">
            Pricing
          </span>
          <h1 className="mx-auto mt-5 max-w-2xl font-heading text-4xl font-semibold leading-[1.1] text-cream-50 sm:text-5xl">
            Free during early access.
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-navy-300">
            Every workspace is free and unrestricted while we’re onboarding early customers — no credit card,
            nothing to unlock. Below is the plan structure we’re building toward for when paid plans launch.
          </p>
          <Link
            href={appPath("/signup")}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-burnt-500 px-5 py-3 text-sm font-semibold text-cream-50 shadow-sm transition-colors hover:bg-burnt-400"
          >
            Start for free <ArrowRight size={16} />
          </Link>
        </Section>
      </div>

      <div className="bg-cream-50">
        <Section>
          <div className="grid gap-6 lg:grid-cols-3">
            {TIERS.map((tier) => (
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
                <p className="mt-5 font-heading text-2xl font-semibold text-navy-900">Coming soon</p>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-navy-600">
                      <Check size={16} className="mt-0.5 shrink-0 text-sage-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contact"
                  className={cn(
                    "mt-7 flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                    tier.highlight
                      ? "bg-navy-900 text-cream-50 hover:bg-navy-800"
                      : "border border-navy-200 text-navy-800 hover:border-navy-400 hover:bg-navy-100/50"
                  )}
                >
                  Contact us
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-navy-400">
            Questions about pricing or what’s included?{" "}
            <Link href="/about#faq" className="font-medium text-burnt-600 hover:underline">
              Check the FAQ
            </Link>{" "}
            or{" "}
            <Link href="/contact" className="font-medium text-burnt-600 hover:underline">
              get in touch
            </Link>
            .
          </p>
        </Section>
      </div>
    </>
  );
}
