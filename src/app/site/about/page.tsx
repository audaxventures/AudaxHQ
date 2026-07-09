import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar, DollarSign, FileText, Mail, MessageSquare, Sheet } from "lucide-react";
import { Section } from "@/components/site/Section";
import { appPath } from "@/lib/site";

export const metadata: Metadata = {
  title: "About — Audax HQ",
  description: "Audax HQ was built by operators, for operators — one workspace instead of a stack of disconnected tools.",
};

const SCATTERED_TOOLS = [
  { icon: Sheet, label: "Spreadsheets" },
  { icon: Mail, label: "Email threads" },
  { icon: Calendar, label: "A separate calendar" },
  { icon: FileText, label: "Shared docs" },
  { icon: DollarSign, label: "An invoicing app" },
  { icon: MessageSquare, label: "Chat messages" },
];

const AUDIENCE = [
  "Solo consultants and fractional operators running client work on their own",
  "Small agencies coordinating a handful of clients across a small team",
  "Growing service businesses that have outgrown spreadsheets but aren't ready for enterprise software",
];

export default function AboutPage() {
  return (
    <>
      <div className="bg-navy-900">
        <Section className="py-20 lg:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full border border-navy-700 bg-navy-800 px-3.5 py-1.5 text-xs font-medium text-navy-200">
              About Audax HQ
            </span>
            <h1 className="mt-5 font-heading text-4xl font-semibold leading-[1.1] text-cream-50 sm:text-5xl">
              Built by operators, for operators.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-navy-300">
              We’ve run service businesses ourselves — juggling client work, chasing invoices, and losing track of
              things across too many tools. Audax HQ is the operating system we wished existed: one place to run
              the whole business, instead of stitching six of them together.
            </p>
          </div>
        </Section>
      </div>

      <div className="bg-cream-50">
        <Section>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-heading text-3xl font-semibold text-navy-900">The problem we set out to fix.</h2>
              <p className="mt-4 text-base leading-relaxed text-navy-600">
                Most service businesses run on a patchwork: a spreadsheet for the pipeline, email for client
                history, a separate calendar, shared docs for meeting notes, an invoicing tool for revenue, and chat
                for everything in between. Nothing talks to anything else, and the person running the business is
                the one holding it all together.
              </p>
              <p className="mt-4 text-base leading-relaxed text-navy-600">
                Audax HQ replaces that patchwork with a single workspace — clients, pipeline, revenue, meetings,
                time, and tasks, all connected to the same client record.
              </p>
            </div>
            <div className="rounded-2xl border border-navy-100 bg-white p-8">
              <div className="grid grid-cols-3 gap-4">
                {SCATTERED_TOOLS.map((t) => (
                  <div
                    key={t.label}
                    className="flex flex-col items-center gap-2 rounded-xl border border-navy-100 bg-cream-50 p-3 text-center"
                  >
                    <t.icon size={18} className="text-navy-400" />
                    <span className="text-[11px] leading-tight text-navy-500">{t.label}</span>
                  </div>
                ))}
              </div>
              <div className="my-4 flex items-center justify-center text-navy-300">
                <ArrowRight size={18} className="rotate-90" />
              </div>
              <div className="flex items-center justify-center gap-2.5 rounded-xl bg-navy-900 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- small static brand mark */}
                <img src="/favicon.png" alt="" className="h-7 w-7 rounded-full" />
                <span className="font-heading text-base font-semibold text-cream-50">
                  AUDAX <span className="text-burnt-400">HQ</span>
                </span>
              </div>
            </div>
          </div>
        </Section>
      </div>

      <div className="bg-cream-100">
        <Section>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-semibold text-navy-900">Who it’s for.</h2>
          </div>
          <ul className="mx-auto mt-10 max-w-2xl space-y-4">
            {AUDIENCE.map((a) => (
              <li key={a} className="flex items-start gap-3 rounded-xl border border-navy-100 bg-white p-4">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-burnt-500" />
                <span className="text-sm leading-relaxed text-navy-700">{a}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="bg-navy-900">
        <Section className="text-center">
          <h2 className="font-heading text-3xl font-semibold text-cream-50 sm:text-4xl">See what’s inside.</h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/#features"
              className="inline-flex items-center gap-2 rounded-xl bg-burnt-500 px-5 py-3 text-sm font-semibold text-cream-50 shadow-sm transition-colors hover:bg-burnt-400"
            >
              Explore the features <ArrowRight size={16} />
            </Link>
            <Link
              href={appPath("/signup")}
              className="inline-flex items-center gap-2 rounded-xl border border-navy-600 px-5 py-3 text-sm font-semibold text-cream-100 transition-colors hover:border-navy-400 hover:bg-navy-800"
            >
              Start for free
            </Link>
          </div>
        </Section>
      </div>
    </>
  );
}
