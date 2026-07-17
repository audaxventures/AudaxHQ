import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/site/Section";
import { PricingTiers, type PricingTier } from "@/components/site/PricingTiers";
import { appPath } from "@/lib/site";

const TITLE = "Pricing — Verclara";
const DESCRIPTION = "Verclara is free during early access. Here's what plans will cost once early access ends.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const TIERS: PricingTier[] = [
  {
    name: "Starter",
    audience: "For solo operators & small teams",
    highlight: false,
    monthly: 25,
    annualMonthly: 21,
    annualTotal: 250,
    features: [
      "Up to 2 team members",
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
    monthly: 45,
    annualMonthly: 38,
    annualTotal: 450,
    features: [
      "Everything in Starter",
      "Up to 5 team members",
      "Per-client access control",
      "Assign and hand off tasks across your team",
    ],
  },
  {
    name: "Scale",
    audience: "For growing agencies",
    highlight: false,
    monthly: 75,
    annualMonthly: 63,
    annualTotal: 750,
    features: ["Everything in Growth", "Unlimited team members", "Priority support", "Early access to new features"],
  },
];

export default function PricingPage() {
  return (
    <>
      <div className="relative min-h-[420px] overflow-hidden bg-cream-50 sm:min-h-[480px]">
        {/* eslint-disable-next-line @next/next/no-img-element -- real product photo, not a candidate for next/image in this hero band */}
        <img src="/pricingbackground.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-cream-50/90 sm:hidden" />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-cream-50 from-0% via-cream-50/70 via-30% to-transparent to-55% sm:block" />
        <Section className="relative flex min-h-[420px] flex-col justify-center py-16 sm:min-h-[480px] lg:py-20">
          <div className="max-w-xl">
            <span className="inline-flex items-center rounded-full border border-burnt-300 bg-burnt-100 px-3.5 py-1.5 text-xs font-medium text-burnt-700">
              Pricing
            </span>
            <h1 className="mt-5 font-heading text-4xl font-semibold leading-[1.1] text-navy-900 sm:text-5xl">
              Free during early access.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-navy-700">
              Every workspace is free and unrestricted while we’re onboarding early customers — no credit card,
              nothing to unlock. The plans below are what we’ll move to once early access ends; existing workspaces
              will get advance notice before anything changes.
            </p>
            <Link
              href={appPath("/signup")}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-burnt-500 px-5 py-3 text-sm font-semibold text-cream-50 shadow-sm transition-colors hover:bg-burnt-400"
            >
              Start for free <ArrowRight size={16} />
            </Link>
          </div>
        </Section>
      </div>

      <div className="bg-cream-50">
        <Section>
          <div className="mx-auto mb-10 max-w-xl rounded-xl border border-sage-200 bg-sage-50 px-5 py-3 text-center text-sm text-sage-800">
            You&rsquo;re currently on <span className="font-semibold">early access</span> — every workspace is free
            and unrestricted. Prices below are what plans will cost once early access ends.
          </div>
          <PricingTiers tiers={TIERS} />
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
