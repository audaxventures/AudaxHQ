import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles, Wrench } from "lucide-react";
import { Section } from "@/components/site/Section";
import { PricingTiers } from "@/components/site/PricingTiers";
import { BookDemoButton } from "@/components/site/BookDemoButton";
import { PRICING_TIERS } from "@/lib/pricing";
import { appPath } from "@/lib/site";

const TITLE = "Pricing — Verclara";
const DESCRIPTION = "Start with a free 7-day trial. Simple, transparent pricing that scales with your team.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

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
              Simple pricing. Try it free.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-navy-700">
              Every plan starts with a 7-day free trial — no charge until it ends, cancel anytime. Pick the tier that
              fits your team below.
            </p>
            <Link
              href={appPath("/signup")}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-burnt-500 px-5 py-3 text-sm font-semibold text-cream-50 shadow-sm transition-colors hover:bg-burnt-400"
            >
              Start your free trial <ArrowRight size={16} />
            </Link>
          </div>
        </Section>
      </div>

      <div className="bg-cream-50">
        <Section>
          <div className="mx-auto mb-14 flex max-w-3xl flex-col items-center gap-4 rounded-2xl border-2 border-sage-300 bg-sage-50 px-8 py-8 text-center sm:flex-row sm:gap-6 sm:px-10 sm:py-10 sm:text-left">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-sage-100 text-sage-700">
              <Sparkles size={30} />
            </span>
            <div>
              <p className="font-heading text-2xl font-semibold text-sage-900 sm:text-3xl">7 days, on us</p>
              <p className="mt-2 text-base leading-relaxed text-sage-800 sm:text-lg">
                Every new workspace gets a full 7-day trial with nothing locked. Add a card at signup, but you won&rsquo;t
                be charged until the trial ends — cancel anytime before then and you won&rsquo;t pay a cent.
              </p>
            </div>
          </div>
          <PricingTiers tiers={PRICING_TIERS} />

          <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-navy-400">
            Prices shown are a flat fee for your whole workspace — not per person. Add team members up to your
            plan&rsquo;s limit at no extra cost.
          </p>

          <div className="mx-auto mt-8 max-w-5xl rounded-2xl border border-navy-100 bg-white p-8 sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-100 px-3 py-1 text-xs font-semibold text-navy-600">
                <Wrench size={12} /> Custom
              </span>
              <h2 className="mt-4 font-heading text-2xl font-semibold text-navy-900">
                Need something built specifically for you?
              </h2>
              <p className="mt-2 max-w-xl text-base leading-relaxed text-navy-500">
                For teams with workflows the standard tiers don&rsquo;t quite fit, we&rsquo;ll build custom
                features and integrations directly into your workspace — tell us what you need, and we&rsquo;ll
                tell you what it takes.
              </p>
            </div>
            <div className="mt-6 shrink-0 lg:mt-0">
              <BookDemoButton variant="primary" />
            </div>
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
