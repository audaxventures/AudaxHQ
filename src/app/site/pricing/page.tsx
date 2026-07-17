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
    audience: "For solo operators",
    highlight: false,
    monthly: 29,
    annualMonthly: 24,
    annualTotal: 290,
    features: [
      "1 user",
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
    monthly: 59,
    annualMonthly: 49,
    annualTotal: 590,
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
    monthly: 99,
    annualMonthly: 83,
    annualTotal: 990,
    features: ["Everything in Growth", "Unlimited team members", "Priority support", "Early access to new features"],
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
            nothing to unlock. The plans below are what we’ll move to once early access ends; existing workspaces
            will get advance notice before anything changes.
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
