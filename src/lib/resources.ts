// Shared listing metadata for the /resources section — the single source of
// truth for the index page's card grid and sitemap.ts's URL list. Each
// post's own page.tsx owns its full body content and metadata export
// independently (see src/app/site/resources/<slug>/page.tsx); this array
// only needs to stay in sync on title/description/date, not full content.

export type ResourcePost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string; // YYYY-MM-DD
  readingMinutes: number;
};

export const RESOURCE_POSTS: ResourcePost[] = [
  {
    slug: "best-crm-for-fractional-executives",
    title: "The Best CRM for Fractional Executives",
    description:
      "What a fractional executive actually needs from a CRM — and why most CRMs built for sales teams get it wrong.",
    category: "CRM",
    publishedAt: "2026-06-01",
    readingMinutes: 5,
  },
  {
    slug: "track-client-profitability",
    title: "How to Track Client Profitability Without a Finance Team",
    description: "A practical way for solo consultants and small agencies to see which clients are actually making money.",
    category: "Profitability",
    publishedAt: "2026-06-05",
    readingMinutes: 6,
  },
  {
    slug: "sales-pipeline-for-consulting-business",
    title: "Building a Sales Pipeline for Your Consulting Business",
    description: "A simple, realistic pipeline structure for consultants and fractional operators who sell relationships, not transactions.",
    category: "Sales Pipeline",
    publishedAt: "2026-06-09",
    readingMinutes: 6,
  },
  {
    slug: "client-onboarding-checklist",
    title: "The Client Onboarding Checklist Every Service Business Needs",
    description: "The exact steps to take in the first week of a new client engagement so nothing falls through the cracks.",
    category: "Client Onboarding",
    publishedAt: "2026-06-13",
    readingMinutes: 5,
  },
  {
    slug: "time-tracking-for-client-projects",
    title: "Time Tracking for Client Projects: How to Stop Losing Billable Hours",
    description: "Why service businesses under-bill without realizing it, and a lightweight way to track time that people actually keep up with.",
    category: "Time Tracking",
    publishedAt: "2026-06-17",
    readingMinutes: 5,
  },
  {
    slug: "lead-follow-up-strategies",
    title: "Lead Follow-Up Strategies That Turn Prospects Into Paying Clients",
    description: "Most leads are lost to silence, not rejection. Here's a follow-up system that keeps opportunities alive.",
    category: "Lead Follow-Up",
    publishedAt: "2026-06-21",
    readingMinutes: 5,
  },
  {
    slug: "team-management-for-small-agencies",
    title: "How to Manage a Small Team Without Enterprise Software Overhead",
    description: "Enterprise project management tools are built for a different problem. Here's what small agency teams actually need.",
    category: "Team Management",
    publishedAt: "2026-06-25",
    readingMinutes: 6,
  },
  {
    slug: "meeting-notes-templates-for-client-meetings",
    title: "Meeting Notes Templates Every Client-Facing Business Should Use",
    description: "A repeatable structure for client meeting notes that makes follow-ups, accountability, and handoffs easier.",
    category: "Meeting Notes",
    publishedAt: "2026-06-29",
    readingMinutes: 4,
  },
  {
    slug: "how-fractional-executives-scale",
    title: "How Fractional Executives Can Scale Their Practice Without Losing Control",
    description: "The operational bottlenecks that cap how many clients a fractional executive can serve — and how to remove them.",
    category: "Fractional Executives",
    publishedAt: "2026-07-03",
    readingMinutes: 6,
  },
  {
    slug: "business-operating-system-vs-spreadsheets",
    title: "Why Service Businesses Are Ditching Spreadsheets for an All-in-One Operating System",
    description: "The real cost of running a service business across six disconnected tools — and what changes when it's one.",
    category: "Operations",
    publishedAt: "2026-07-08",
    readingMinutes: 6,
  },
  {
    slug: "how-to-invoice-clients-as-a-consultant",
    title: "How to Invoice Clients as a Consultant Without Chasing Payments",
    description: "A practical invoicing system for consultants and fractional executives so payment stops depending on how hard you chase it.",
    category: "Invoicing",
    publishedAt: "2026-07-16",
    readingMinutes: 5,
  },
  {
    slug: "consulting-proposal-template",
    title: "Consulting Proposal Templates That Actually Win Client Work",
    description: "A practical consulting proposal template and framework that helps you write faster, sound clearer, and close more client work.",
    category: "Proposals",
    publishedAt: "2026-07-20",
    readingMinutes: 6,
  },
  {
    slug: "how-to-handle-scope-creep",
    title: "How to Handle Scope Creep Without Losing the Client Relationship",
    description:
      "Scope creep rarely looks like a client asking for “more.” Here's how to spot it early, push back without souring the relationship, and protect your margins.",
    category: "Scope & Delivery",
    publishedAt: "2026-07-23",
    readingMinutes: 6,
  },
];
