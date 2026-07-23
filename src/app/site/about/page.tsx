import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Calendar,
  CheckSquare,
  Clock,
  Code2,
  Handshake,
  Megaphone,
  NotebookPen,
  Receipt,
  Scale,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Section } from "@/components/site/Section";
import { FAQAccordion } from "@/components/site/FAQAccordion";
import { ScreenshotGallery } from "@/components/site/ScreenshotGallery";
import { FeatureExplorer, type FeatureDetail } from "@/components/site/FeatureExplorer";
import { BookDemoButton } from "@/components/site/BookDemoButton";
import { appPath } from "@/lib/site";

const TITLE = "About — Verclara";
const DESCRIPTION = "Verclara was built by operators, for operators — one workspace instead of a stack of disconnected tools.";

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
  slate: "bg-slate-100 text-slate-600",
  rose: "bg-rose-100 text-rose-600",
};

const FEATURES = [
  { icon: Users, title: "Clients", tone: "sage", description: "Every client relationship, organized in one place." },
  { icon: Target, title: "Leads & Pipeline", tone: "gold", description: "Track opportunities from first contact to close." },
  { icon: NotebookPen, title: "Meeting Notes", tone: "violet", description: "Capture every conversation, searchable later." },
  { icon: Calendar, title: "Calendar & Follow-ups", tone: "blue", description: "Never miss a check-in or a deadline." },
  { icon: Receipt, title: "Revenue Tracking", tone: "teal", description: "Revenue and cash flow, always up to date." },
  { icon: Clock, title: "Hour & Cost Tracker", tone: "rose", description: "Track time and costs against every client." },
  { icon: CheckSquare, title: "To-Dos & Tasks", tone: "brick", description: "Stay on top of what matters most, together." },
  { icon: BarChart3, title: "Dashboard & Reports", tone: "slate", description: "A real-time view of how the business is doing." },
];

const FEATURE_DETAILS: FeatureDetail[] = [
  {
    iconSmall: <Users size={18} />,
    iconLarge: <Users size={56} strokeWidth={1.5} />,
    title: "Clients",
    tone: "sage",
    summary: "Every client relationship in one record.",
    description:
      "Each client gets a single home for everything about that relationship — contact details, project or retainer terms, meeting history, invoices, files, and every task tied to their account. No more digging through email threads or a dozen scattered docs to remember where things stand.",
    capabilities: [
      "Track project-based or recurring (monthly) engagements, each with its own rate and billing rhythm",
      "Color-code and organize clients by status — active, paused, or archived",
      "See linked invoices, meeting notes, tasks, and documents on one page",
      "Control exactly which team members can see and work on each client",
    ],
    image: "/clientsdesktopdesk.png",
    imageAlt: "The Verclara client detail page open on a desktop",
  },
  {
    iconSmall: <Target size={18} />,
    iconLarge: <Target size={56} strokeWidth={1.5} />,
    title: "Leads & Pipeline",
    tone: "gold",
    summary: "Every opportunity, tracked to close.",
    description:
      "Leads move through a clear pipeline from first contact to signed client, so nothing sits forgotten in an inbox. Convert a lead into a client with its history intact the moment a deal closes.",
    capabilities: [
      "A visual pipeline you can adapt to how you actually sell",
      "Follow-up reminders so a promising lead never goes cold",
      "One-click conversion from lead to client, carrying notes and history forward",
      "Lead source tracking to see which channels actually bring in business",
    ],
    image: "/leadsdesktop.png",
    imageAlt: "The Verclara leads pipeline open on a desktop",
  },
  {
    iconSmall: <NotebookPen size={18} />,
    iconLarge: <NotebookPen size={56} strokeWidth={1.5} />,
    title: "Meeting Notes",
    tone: "violet",
    summary: "Every conversation, captured and searchable.",
    description:
      "Log meeting notes directly against the client or lead they belong to, complete with agenda, discussion notes, and action items — so anyone on the team can catch up on a relationship in seconds.",
    capabilities: [
      "Schedule meetings ahead of time with date, time, timezone, and location",
      "Quick-add action items that turn into to-dos automatically — split between your team and the client's own commitments",
      "Branded PDF export you can email straight to a client after the call",
      "Rich text formatting for agendas and notes",
    ],
    image: "/meetingnotesdesktop.png",
    imageAlt: "A Verclara meeting note open on a desktop",
  },
  {
    iconSmall: <Calendar size={18} />,
    iconLarge: <Calendar size={56} strokeWidth={1.5} />,
    title: "Calendar & Follow-ups",
    tone: "blue",
    summary: "Never miss a check-in or a deadline.",
    description:
      "A shared calendar pulls together meetings, follow-ups, and task due dates so your whole week is visible in one place — including events from any external calendar you connect.",
    capabilities: [
      "Set follow-up reminders on any client or lead so nothing falls through",
      "Connect an external calendar feed to see personal commitments alongside client work",
      "Assign follow-ups to specific team members",
      "See what's due today right from the dashboard",
    ],
  },
  {
    iconSmall: <Receipt size={18} />,
    iconLarge: <Receipt size={56} strokeWidth={1.5} />,
    title: "Revenue Tracking",
    tone: "teal",
    summary: "Revenue and cash flow, always up to date.",
    description:
      "Every invoice is tracked through its real billing status — not invoiced, invoiced, or paid — so you always know what's outstanding, what's collected, and how revenue breaks down by client and type of work.",
    capabilities: [
      "Dashboard card showing this month's and last month's revenue, calculated from what's actually been paid",
      "Revenue trends over time, plus a breakdown by client and by type of work",
      "Export a PDF or CSV invoice report per client — built for reconciling against your bank or bookkeeping software",
      "Support for both fixed-fee and hourly invoices",
    ],
    image: "/revenuetrackingdesktop.png",
    imageAlt: "The Verclara revenue tracking page open on a desktop",
  },
  {
    iconSmall: <Clock size={18} />,
    iconLarge: <Clock size={56} strokeWidth={1.5} />,
    title: "Hour & Cost Tracker",
    tone: "rose",
    summary: "Track time and costs against every client.",
    description:
      "Log billable and non-billable hours or one-off costs against a client, then see profitability at a glance — what a client actually costs you to serve, not just what they're billed.",
    capabilities: [
      "Log time entries or fixed costs in a couple of clicks, right from the client page",
      "See cost and profitability rollups by client, date range, or team member",
      "Track billable vs. non-billable time separately",
      "Export a cost report for any date range",
    ],
    image: "/costtrackerdesktop.png",
    imageAlt: "The Verclara hour and cost tracker open on a desktop",
  },
  {
    iconSmall: <CheckSquare size={18} />,
    iconLarge: <CheckSquare size={56} strokeWidth={1.5} />,
    title: "To-Dos & Tasks",
    tone: "brick",
    summary: "Stay on top of what matters most, together.",
    description:
      "A shared to-do board keeps client work, internal tasks, and follow-ups organized by priority and assignee — so everyone on the team knows exactly what's theirs to do next.",
    capabilities: [
      "Kanban-style board with priority levels and due dates",
      "Assign tasks to specific team members, or keep a personal board",
      "Tasks link back to the client or lead they belong to automatically",
      "Quick-add tasks straight from a meeting note's action items",
    ],
    image: "/todolaptop.png",
    imageAlt: "The Verclara to-do board open on a laptop",
  },
  {
    iconSmall: <BarChart3 size={18} />,
    iconLarge: <BarChart3 size={56} strokeWidth={1.5} />,
    title: "Dashboard & Reports",
    tone: "slate",
    summary: "A real-time view of how the business is doing.",
    description:
      "The dashboard pulls together revenue, pipeline, tasks, and client activity into one view the moment you log in — so you know exactly where the business stands without opening five different tabs.",
    capabilities: [
      "This month's and last month's revenue, calculated automatically",
      "Pipeline summary showing where every lead stands",
      "Snapshot of what's due today across tasks and follow-ups",
      "A quick view into your most active clients",
    ],
    image: "/demodashboardweb.png",
    imageAlt: "The Verclara dashboard open on a desktop",
  },
];

const AUDIENCE = [
  {
    icon: Handshake,
    title: "Fractional Executives",
    description: "Run every client engagement from one workspace instead of juggling separate setups per client.",
  },
  { icon: Briefcase, title: "Consulting Firms", description: "Manage clients, projects, and deliverables in one place." },
  {
    icon: Megaphone,
    title: "Marketing & Creative Agencies",
    description: "Streamline campaigns, deadlines, and client feedback together.",
  },
  { icon: Scale, title: "Professional Services", description: "Built for accountants, advisors, coaches, and more." },
  { icon: Code2, title: "IT & Software Teams", description: "Track projects, time, and client success in one workspace." },
  { icon: Sparkles, title: "And more", description: "Any service business that runs on client relationships." },
];

const GALLERY = [
  { src: "/demodashboardweb.png", alt: "Verclara dashboard overview" },
  { src: "/democlientweb.png", alt: "Verclara clients list" },
  { src: "/meetingnotes.png", alt: "Verclara meeting notes list" },
  { src: "/todo.png", alt: "Verclara to-do board" },
  { src: "/leadsdesktop.png", alt: "Verclara leads pipeline" },
  { src: "/newclientdesktop.png", alt: "Verclara new client form" },
  { src: "/revenuetrackingdesktop.png", alt: "Verclara revenue tracking" },
  { src: "/costtrackerdesktop.png", alt: "Verclara hour and cost tracker" },
  { src: "/settingsdesktop.png", alt: "Verclara settings" },
];

const FAQ_ITEMS = [
  {
    question: "What is Verclara?",
    answer:
      "A single workspace for running a service business — clients and leads, pipeline, revenue tracking, meeting notes, time and cost tracking, and tasks, all connected to the same client record instead of spread across separate tools.",
  },
  {
    question: "Who is it built for?",
    answer:
      "Solo consultants, fractional operators, and small agency teams — anyone running client work who's outgrown spreadsheets and email threads but doesn't need (or want) enterprise software.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Verclara is free to use during early access — no credit card, no time limit. We'll introduce paid plans later, and we'll give existing workspaces plenty of notice before anything changes.",
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
      "Yes — Settings includes a data export for your clients, leads, revenue records, tasks, and time entries at any point, so you're never locked in.",
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
  {
    question: "Is Verclara a CRM?",
    answer:
      "Yes — client and lead management is the core of Verclara, alongside pipeline tracking, revenue, meetings, time, and tasks. Most CRMs stop at contacts and deals; Verclara connects the CRM to the rest of how you actually run client work.",
  },
  {
    question: "Does Verclara replace spreadsheets?",
    answer:
      "For most of what a spreadsheet does in a service business — client tracking, pipeline, revenue, time — yes. The difference is everything stays connected to the same client record automatically, instead of living in separate tabs you have to keep in sync by hand.",
  },
  {
    question: "Can I track billing and revenue in Verclara?",
    answer:
      "Yes. Time and fixed costs are logged against each client, and each invoice is tracked through its billing status — not invoiced, invoiced, or paid — so you always know what's outstanding and how it affects profitability. Verclara tracks that status; it doesn't generate or send the invoice itself, so it's not a replacement for your accounting or bookkeeping software.",
  },
  {
    question: "Does Verclara replace accounting or bookkeeping software?",
    answer:
      "No. Verclara tracks revenue, costs, and billing status per client so you can see profitability at a glance, but it isn't accounting software. You'll still use QuickBooks, Xero, or your bookkeeper for actual invoicing, taxes, and financial statements.",
  },
  {
    question: "Is Verclara built for fractional executives and consultants?",
    answer:
      "Yes — Verclara was designed specifically for people running client-based service work: fractional executives, consultants, and small agency teams managing multiple client relationships at once.",
  },
  {
    question: "How is Verclara different from project management tools like Asana or Trello?",
    answer:
      "Project management tools track tasks. Verclara tracks the whole client relationship — the CRM record, the pipeline, the revenue, the meeting notes, and the tasks — so nothing about a client lives in a separate app from everything else about them.",
  },
];

const FAQ_LEFT = FAQ_ITEMS.slice(0, Math.ceil(FAQ_ITEMS.length / 2));
const FAQ_RIGHT = FAQ_ITEMS.slice(Math.ceil(FAQ_ITEMS.length / 2));

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="relative min-h-[420px] overflow-hidden bg-cream-50 sm:min-h-[480px]">
        {/* eslint-disable-next-line @next/next/no-img-element -- real lifestyle photo, not a candidate for next/image in this hero band */}
        <img src="/aboutherobackground.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-cream-50/90 sm:hidden" />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-cream-50 from-0% via-cream-50/70 via-30% to-transparent to-55% sm:block" />
        <Section className="relative flex min-h-[420px] flex-col justify-center py-16 sm:min-h-[480px] lg:py-20">
          <div className="max-w-xl">
            <span className="inline-flex items-center rounded-full border border-burnt-300 bg-burnt-100 px-3.5 py-1.5 text-xs font-medium text-burnt-700">
              About Verclara
            </span>
            <h1 className="mt-5 font-heading text-4xl font-semibold leading-[1.1] text-navy-900 sm:text-5xl">
              Built by operators, for operators.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-navy-700">
              We’ve run service businesses ourselves — juggling client work, chasing payments, and losing track of
              things across too many tools. Verclara is the operating system we wished existed: one place to run
              the whole business, instead of stitching six of them together.
            </p>
          </div>
        </Section>
      </div>

      <div className="bg-cream-50">
        <Section>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-burnt-600">
                Why we built Verclara
              </span>
              <h2 className="mt-3 font-heading text-3xl font-semibold text-navy-900 sm:text-4xl">
                Built from the ground up to solve real problems.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-navy-600">
                We built Verclara because we lived the same problems you’re dealing with today — too many tools,
                scattered information, and manual follow-ups that fall through the cracks.
              </p>
              <p className="mt-4 text-base leading-relaxed text-navy-600">
                Time was going into stitching together a spreadsheet for the pipeline, email for client history, a
                separate calendar, shared docs for meeting notes, and a separate tool for tracking revenue — when
                all of it should have lived in one place from the start.
              </p>
              <p className="mt-4 text-base leading-relaxed text-navy-600">
                Verclara brings it together in one connected workspace, built specifically for service businesses.
                It’s the platform we always wished existed.
              </p>
            </div>
            <div className="aspect-[3/4] overflow-hidden rounded-2xl shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element -- real lifestyle photo, not a candidate for next/image in this static marketing card */}
              <img
                src="/meetingnotesdesktop.png"
                alt="A person reviewing their Verclara meeting notes on their desktop"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </Section>
      </div>

      <div id="features" className="bg-cream-100">
        <Section>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="aspect-[3/4] overflow-hidden rounded-2xl shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element -- real lifestyle photo, not a candidate for next/image in this static marketing card */}
              <img
                src="/todolaptop.png"
                alt="A person reviewing their Verclara to-do board on their laptop"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-burnt-600">Core features</span>
              <h2 className="mt-3 font-heading text-3xl font-semibold text-navy-900 sm:text-4xl">
                Everything you need to run your business.
              </h2>
              <div className="mt-8 grid grid-cols-2 gap-6">
                {FEATURES.map((f) => (
                  <div key={f.title} className="rounded-2xl border border-navy-100 bg-white p-5">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${FEATURE_TONE[f.tone]}`}>
                      <f.icon size={20} />
                    </span>
                    <h3 className="mt-3 font-heading text-base font-semibold text-navy-900">{f.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-navy-500">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>
      </div>

      <div className="bg-cream-50">
        <Section>
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-burnt-600">Explore the platform</span>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-navy-900 sm:text-4xl">
              What each feature actually does.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-navy-600">
              The overview above is the quick version. Pick a feature below for the details — what it tracks, how
              it fits together with the rest of your workspace, and exactly what you can do with it.
            </p>
          </div>
          <FeatureExplorer features={FEATURE_DETAILS} />
        </Section>
      </div>

      <div className="bg-cream-50">
        <Section>
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-burnt-600">Who it’s for</span>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-navy-900 sm:text-4xl">
              Built for service-based businesses like yours.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-navy-600">
              Verclara is designed for service-based businesses that rely on strong client relationships, project
              work, and daily operational excellence — whether you’re a solo founder or leading a growing team.
            </p>
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {AUDIENCE.map((a) => (
              <div key={a.title} className="rounded-2xl border border-navy-100 bg-white p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-burnt-100 text-burnt-600">
                  <a.icon size={20} />
                </span>
                <h3 className="mt-3 font-heading text-base font-semibold text-navy-900">{a.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-navy-500">{a.description}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="bg-cream-100">
        <Section>
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-burnt-600">See it in action</span>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-navy-900 sm:text-4xl">
              A closer look at the platform.
            </h2>
          </div>
          <ScreenshotGallery shots={GALLERY} />
        </Section>
      </div>

      <div id="faq" className="bg-cream-50">
        <Section>
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-burnt-600">FAQ</span>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-navy-900 sm:text-4xl">
              Frequently asked questions.
            </h2>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <FAQAccordion items={FAQ_LEFT} />
            <FAQAccordion items={FAQ_RIGHT} />
          </div>
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
          <h2 className="font-heading text-3xl font-semibold text-cream-50 sm:text-4xl">
            Ready to run your business better?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base text-navy-300">
            Start your workspace today — free during early access, no credit card required.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={appPath("/signup")}
              className="inline-flex items-center gap-2 rounded-xl bg-burnt-500 px-5 py-3 text-sm font-semibold text-cream-50 shadow-sm transition-colors hover:bg-burnt-400"
            >
              Start for free <ArrowRight size={16} />
            </Link>
            <BookDemoButton variant="on-dark" />
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
