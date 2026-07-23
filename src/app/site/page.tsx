import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, Check, CheckSquare, Clock, NotebookPen, Quote, Receipt, Target, Users } from "lucide-react";
import { Section } from "@/components/site/Section";
import { DeviceShowcase } from "@/components/site/DeviceShowcase";
import { PlatformShotsGallery } from "@/components/site/PlatformShotsGallery";
import { BookDemoButton } from "@/components/site/BookDemoButton";
import { appPath } from "@/lib/site";

// Both are framer-motion consumers — split into their own chunks so the
// animation library's JS isn't parsed/executed as part of the main bundle
// that blocks the hero H1's initial paint (it was showing up as ~50KB of
// "unused JavaScript" on the critical path in Lighthouse). SSR stays on by
// default, so there's no layout shift or content flash — only the
// hydration JS for the animations themselves loads out-of-band.
const DashboardHeroMock = dynamic(() => import("@/components/site/DashboardHeroMock").then((m) => m.DashboardHeroMock));
const WhyVerclaraWordmark = dynamic(() => import("@/components/site/WhyVerclaraWordmark").then((m) => m.WhyVerclaraWordmark));

const TITLE = "Verclara — CRM & Business OS for Service Businesses";
const DESCRIPTION =
  "The CRM and business operating system for consultants, agencies, and fractional executives — clients, pipeline, revenue, meetings, and time in one place.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const FEATURE_TONE: Record<string, string> = {
  sage: "bg-sage-100 text-sage-600",
  gold: "bg-gold-100 text-gold-600",
  blue: "bg-blue-100 text-blue-600",
  violet: "bg-violet-100 text-violet-600",
  teal: "bg-teal-100 text-teal-600",
  brick: "bg-brick-100 text-brick-600",
};

const FEATURES = [
  {
    icon: Users,
    title: "Clients & Projects",
    tone: "sage",
    description: "Everything about your clients, organized.",
  },
  {
    icon: Target,
    title: "Leads & Pipeline",
    tone: "gold",
    description: "Track every opportunity and close deals faster.",
  },
  {
    icon: Receipt,
    title: "Revenue Tracking",
    tone: "blue",
    description: "Know your numbers, at a glance.",
  },
  {
    icon: NotebookPen,
    title: "Meetings & Notes",
    tone: "violet",
    description: "Capture every conversation and never miss a detail.",
  },
  {
    icon: Clock,
    title: "Time & Costs",
    tone: "teal",
    description: "Track time, costs, and profitability.",
  },
  {
    icon: CheckSquare,
    title: "Tasks & Follow-ups",
    tone: "brick",
    description: "Stay on top of what matters most.",
  },
];

const PLATFORM_SHOTS = [
  { src: "/demosidebarhandmobile.png", alt: "Verclara mobile navigation menu, held in hand" },
  { src: "/meetingnotesdesktop.png", alt: "Verclara meeting notes list on desktop" },
  { src: "/quickactionmobilehand.png", alt: "Verclara quick actions menu on mobile" },
  { src: "/todolaptop.png", alt: "Verclara to-do board open on a laptop" },
];

const TESTIMONIALS = [
  {
    quote:
      "We’ve replaced four different tools with Verclara, and our team is more organized and productive than ever. Verclara has changed how we manage clients, leads and daily operations, all in one place!",
    name: "Denise Zaporzan",
    company: "Asteria Global",
  },
  {
    quote:
      "I used to lose track of leads in my inbox. Now every opportunity is in one pipeline, and I can see exactly what needs a follow-up today.",
    name: "Marcus Webb",
    company: "Webb Fractional CFO Services",
  },
  {
    quote:
      "Verclara showed us which clients were actually profitable and which ones were quietly costing us money. That alone paid for itself in the first month.",
    name: "Priya Chandrasekaran",
    company: "Chandrasekaran & Co.",
  },
  {
    quote:
      "Meeting notes, action items, and follow-ups used to live in three different apps. Now they’re attached to the client record where they belong — nothing falls through the cracks anymore.",
    name: "Jordan Okafor",
    company: "Bright Path Coaching",
  },
];

export default function MarketingHomePage() {
  return (
    <>
      <div className="relative overflow-hidden bg-navy-900">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 right-[-10%] h-[560px] w-[560px] rounded-full bg-burnt-500/25 blur-[130px]" />
          <div className="absolute -bottom-32 -left-16 h-[420px] w-[420px] rounded-full bg-blue-600/15 blur-[120px]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-navy-600 to-transparent" />
        </div>
        <Section className="relative grid items-center gap-16 py-12 sm:py-16 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex items-center justify-center rounded-full border border-burnt-400/40 bg-burnt-500/10 px-3.5 py-1.5 text-center text-xs font-semibold uppercase tracking-wider text-burnt-300">
              Built for Fractional Executives &amp; Service Based Business Owners
            </span>
            <h1 className="mt-5 font-heading text-4xl font-semibold leading-[1.08] text-cream-50 sm:text-5xl lg:text-[3.25rem]">
              Run your business from <span className="text-burnt-400">one command center</span>.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-navy-300">
              Clients, pipeline, revenue tracking, meetings, time, and tasks — finally in one workspace instead of six
              disconnected tools.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={appPath("/signup")}
                className="inline-flex items-center gap-2 rounded-xl bg-burnt-500 px-5 py-3 text-sm font-semibold text-cream-50 shadow-sm transition-colors hover:bg-burnt-400"
              >
                Start for free <ArrowRight size={16} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-navy-600 px-5 py-3 text-sm font-semibold text-cream-100 transition-colors hover:border-navy-400 hover:bg-navy-800"
              >
                Talk to us
              </Link>
            </div>
          </div>
          <DashboardHeroMock />
        </Section>
      </div>

      <div id="features" className="bg-cream-50">
        <Section className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-heading text-3xl font-semibold leading-tight text-navy-900 sm:text-4xl">
              Everything you need.
              <br />
              All in one place.
            </h2>
            <span className="mt-4 block h-1 w-10 rounded-full bg-burnt-500" />
            <p className="mt-5 max-w-md text-base leading-relaxed text-navy-500">
              Verclara brings every part of your business together so you can stay organized, deliver exceptional
              work, and grow with confidence.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-8">
              {FEATURES.map((f) => (
                <div key={f.title}>
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${FEATURE_TONE[f.tone]}`}>
                    <f.icon size={20} />
                  </span>
                  <h3 className="mt-3 font-heading text-base font-semibold text-navy-900">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-navy-500">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
          <DeviceShowcase />
        </Section>
      </div>

      <div className="bg-cream-50">
        <Section className="py-0 pb-16 sm:pb-20">
          <PlatformShotsGallery shots={PLATFORM_SHOTS} />
        </Section>
      </div>

      <div className="relative overflow-hidden bg-navy-900">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[420px] w-[640px] -translate-x-1/2 rounded-full bg-burnt-500/15 blur-[130px]" />
        </div>
        <Section className="relative flex flex-col items-center py-20 text-center sm:py-24">
          <span className="inline-flex items-center rounded-full border border-burnt-400/40 bg-burnt-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-burnt-300">
            The name
          </span>
          <h2 className="mt-5 font-heading text-3xl font-semibold text-cream-50 sm:text-4xl">Why Verclara?</h2>
          <div className="mt-10">
            <WhyVerclaraWordmark />
          </div>
          <span className="mt-10 block h-1 w-10 rounded-full bg-burnt-500" />
          <p className="mx-auto mt-6 max-w-2xl font-heading text-xl font-medium italic leading-relaxed text-cream-100 sm:text-2xl">
            &ldquo;Verclara gives service businesses one clear, trustworthy view of every client, lead, and dollar —
            so nothing gets lost in the noise.&rdquo;
          </p>
        </Section>
      </div>

      <div className="bg-cream-100">
        <Section className="py-16 sm:py-20">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-burnt-600">Loved by teams</span>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-navy-900 sm:text-4xl">
              What people are saying
            </h2>
          </div>
          <div className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-2">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border border-navy-100 bg-white p-7">
                <Quote size={28} fill="currentColor" stroke="none" className="text-burnt-500" />
                <p className="mt-4 font-heading text-lg font-medium leading-snug text-navy-900">{t.quote}</p>
                <p className="mt-4 text-sm text-navy-500">
                  — {t.name}, {t.company}
                </p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="bg-cream-50">
        <Section className="py-16 sm:py-20">
          <div className="relative min-h-[440px] overflow-hidden rounded-2xl border border-navy-100 sm:min-h-[480px]">
            {/* eslint-disable-next-line @next/next/no-img-element -- large decorative photo, not a candidate for next/image in this static marketing card */}
            <img src="/sidebar.png" alt="" className="absolute inset-0 h-full w-full object-cover object-bottom" />
            <div className="absolute inset-0 bg-gradient-to-r from-cream-50/85 via-cream-50/40 to-transparent" />
            <div className="relative flex h-full flex-col justify-center px-7 py-10 sm:px-12 sm:py-14 lg:max-w-md">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-navy-300 text-navy-700">
                <Check size={18} />
              </span>
              <h2 className="mt-5 font-heading text-3xl font-semibold leading-tight text-navy-900 sm:text-4xl">
                Ready to simplify your business?
              </h2>
              <p className="mt-2 font-heading text-lg text-navy-700">Start your workspace today.</p>
              <ul className="mt-6 flex flex-col gap-2 text-sm text-navy-700">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-sage-600" /> Free during early access
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-sage-600" /> No credit card required
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-sage-600" /> Your data, always exportable
                </li>
              </ul>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={appPath("/signup")}
                  className="inline-flex items-center gap-2 rounded-xl bg-burnt-500 px-5 py-3 text-sm font-semibold text-cream-50 shadow-sm transition-colors hover:bg-burnt-400"
                >
                  Start for free <ArrowRight size={16} />
                </Link>
                <BookDemoButton variant="on-light" />
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-navy-300 px-5 py-3 text-sm font-semibold text-navy-800 transition-colors hover:border-navy-400 hover:bg-white"
                >
                  Talk to us
                </Link>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </>
  );
}
