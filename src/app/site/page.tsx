import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckSquare, Clock, NotebookPen, Receipt, Target, Users } from "lucide-react";
import { Section } from "@/components/site/Section";
import { DashboardHeroMock } from "@/components/site/DashboardHeroMock";
import { appPath } from "@/lib/site";

export const metadata: Metadata = {
  title: "Audax HQ — The business operating system for service businesses",
  description:
    "Clients, pipeline, invoicing, meetings, time, and tasks — all in one workspace instead of six disconnected tools.",
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
    description: "Every client relationship, project detail, and file — organized in one record instead of scattered folders.",
  },
  {
    icon: Target,
    title: "Leads & Pipeline",
    tone: "gold",
    description: "Track opportunities from first contact to signed client, with lead source reporting built in.",
  },
  {
    icon: Receipt,
    title: "Revenue Tracking",
    tone: "blue",
    description: "Invoice clients, track what's been paid, and see exactly which balances are aging.",
  },
  {
    icon: NotebookPen,
    title: "Meetings & Notes",
    tone: "violet",
    description: "Log every call with agendas, notes, and action items — searchable, not buried in someone's inbox.",
  },
  {
    icon: Clock,
    title: "Time & Costs",
    tone: "teal",
    description: "Track billable hours and project costs, and know your real profitability on every client.",
  },
  {
    icon: CheckSquare,
    title: "Tasks & Follow-ups",
    tone: "brick",
    description: "Assign work across your team and keep every follow-up from falling through the cracks.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Create your workspace",
    description: "Sign up in under a minute — no credit card, nothing to install.",
  },
  {
    n: "2",
    title: "Add your clients and leads",
    description: "Bring in who you already work with, and set up the tags and categories that match how you actually work.",
  },
  {
    n: "3",
    title: "Run your business",
    description: "Track work, log time, send invoices, and keep your whole team looking at the same information.",
  },
];

export default function MarketingHomePage() {
  return (
    <>
      <div className="bg-navy-900">
        <Section className="grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex items-center rounded-full border border-navy-700 bg-navy-800 px-3.5 py-1.5 text-xs font-medium text-navy-200">
              Built for service businesses
            </span>
            <h1 className="mt-5 font-heading text-4xl font-semibold leading-[1.08] text-cream-50 sm:text-5xl lg:text-[3.25rem]">
              Run your business from one command center.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-navy-300">
              Clients, pipeline, invoicing, meetings, time, and tasks — finally in one workspace instead of six
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

      <div className="bg-cream-100">
        <Section className="py-12 sm:py-14">
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-navy-100 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div>
              <span className="inline-flex items-center rounded-full bg-burnt-100 px-3 py-1 text-xs font-semibold text-burnt-600">
                Now in early access
              </span>
              <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-navy-600">
                Audax HQ is a new product, built by people who’ve run service businesses themselves. We’re bringing
                on our first customers now — early feedback shapes what we build next.
              </p>
            </div>
            <ul className="flex shrink-0 flex-col gap-1.5 text-sm text-navy-700 sm:items-end">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-sage-600" /> Free to get started
              </li>
              <li className="flex items-center gap-2 sm:justify-end">
                <span className="h-1.5 w-1.5 rounded-full bg-sage-600" /> No credit card required
              </li>
              <li className="flex items-center gap-2 sm:justify-end">
                <span className="h-1.5 w-1.5 rounded-full bg-sage-600" /> Your data, always exportable
              </li>
            </ul>
          </div>
        </Section>
      </div>

      <div id="features" className="bg-cream-50">
        <Section>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-semibold text-navy-900 sm:text-4xl">
              Everything in one workspace.
            </h2>
            <p className="mt-3 text-base text-navy-500">No more six tabs open just to answer one client question.</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-navy-100 bg-white p-6">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${FEATURE_TONE[f.tone]}`}>
                  <f.icon size={20} />
                </span>
                <h3 className="mt-4 font-heading text-lg font-medium text-navy-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-navy-500">{f.description}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="bg-cream-100">
        <Section>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-semibold text-navy-900 sm:text-4xl">
              From signup to running your business.
            </h2>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 font-heading text-sm font-semibold text-cream-50">
                  {s.n}
                </span>
                <h3 className="mt-4 font-heading text-lg font-medium text-navy-900">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-navy-500">{s.description}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="bg-navy-900">
        <Section className="text-center">
          <h2 className="font-heading text-3xl font-semibold text-cream-50 sm:text-4xl">
            Ready to get out of the spreadsheets?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base text-navy-300">
            Set up your workspace in a couple of minutes — free to start, no credit card.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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
        </Section>
      </div>
    </>
  );
}
