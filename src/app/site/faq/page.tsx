import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/site/Section";
import { FAQAccordion } from "@/components/site/FAQAccordion";
import { appPath } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ — Audax HQ",
  description: "Answers to common questions about Audax HQ.",
};

const FAQ_ITEMS = [
  {
    question: "What is Audax HQ?",
    answer:
      "A single workspace for running a service business — clients and leads, pipeline, revenue and invoicing, meeting notes, time and cost tracking, and tasks, all connected to the same client record instead of spread across separate tools.",
  },
  {
    question: "Who is it built for?",
    answer:
      "Solo consultants, fractional operators, and small agency teams — anyone running client work who's outgrown spreadsheets and email threads but doesn't need (or want) enterprise software.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Audax HQ is free to use during early access — no credit card, no time limit. We'll introduce paid plans later, and we'll give existing workspaces plenty of notice before anything changes.",
  },
  {
    question: "Can I add my team?",
    answer:
      "Yes. You can invite team members and control exactly which clients each person can see and work on, so everyone has access to what they need and nothing else.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Your data is stored in a Postgres database (Neon) and file storage (Supabase), each isolated to your workspace. We don't sell or share your data.",
  },
  {
    question: "Can I get my data out if I ever need to?",
    answer:
      "Yes — Settings includes a data export for your clients, leads, invoices, tasks, and time entries at any point, so you're never locked in.",
  },
  {
    question: "How do I get help if I'm stuck?",
    answer:
      "New workspaces get a short getting-started walkthrough and a welcome email with pointers on where to start. Beyond that, email info@audaxventures.ca and we'll help directly.",
  },
  {
    question: "What if I want to close my account?",
    answer: "Email us at info@audaxventures.ca and we'll take care of it for you.",
  },
];

export default function FAQPage() {
  return (
    <>
      <div className="bg-navy-900">
        <Section className="py-20 text-center lg:py-24">
          <span className="inline-flex items-center rounded-full border border-navy-700 bg-navy-800 px-3.5 py-1.5 text-xs font-medium text-navy-200">
            FAQ
          </span>
          <h1 className="mx-auto mt-5 max-w-xl font-heading text-4xl font-semibold leading-[1.1] text-cream-50 sm:text-5xl">
            Questions, answered.
          </h1>
        </Section>
      </div>

      <div className="bg-cream-50">
        <Section className="max-w-3xl!">
          <FAQAccordion items={FAQ_ITEMS} />
          <div className="mt-10 text-center">
            <p className="text-sm text-navy-500">Still have a question?</p>
            <Link
              href="/contact"
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-semibold text-cream-50 hover:bg-navy-800"
            >
              Contact us <ArrowRight size={16} />
            </Link>
          </div>
        </Section>
      </div>

      <div className="bg-navy-900">
        <Section className="text-center">
          <h2 className="font-heading text-3xl font-semibold text-cream-50 sm:text-4xl">Ready to try it yourself?</h2>
          <Link
            href={appPath("/signup")}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-burnt-500 px-5 py-3 text-sm font-semibold text-cream-50 shadow-sm transition-colors hover:bg-burnt-400"
          >
            Start for free <ArrowRight size={16} />
          </Link>
        </Section>
      </div>
    </>
  );
}
