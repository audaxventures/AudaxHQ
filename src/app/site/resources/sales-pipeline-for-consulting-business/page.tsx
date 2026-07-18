import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout, ArticleH2, ArticleP, ArticleUL } from "@/components/site/ArticleLayout";

const SLUG = "sales-pipeline-for-consulting-business";
const DISPLAY_TITLE = "Building a Sales Pipeline for Your Consulting Business";
const TITLE = `${DISPLAY_TITLE} — Verclara`;
const DESCRIPTION =
  "A simple, realistic pipeline structure for consultants and fractional operators who sell relationships, not transactions.";
const CATEGORY = "Sales Pipeline";
const PUBLISHED_AT = "2026-06-09";
const READING_MINUTES = 6;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function Page() {
  return (
    <ArticleLayout
      slug={SLUG}
      title={DISPLAY_TITLE}
      description={DESCRIPTION}
      category={CATEGORY}
      publishedAt={PUBLISHED_AT}
      readingMinutes={READING_MINUTES}
      relatedSlugs={["lead-follow-up-strategies", "client-onboarding-checklist", "best-crm-for-fractional-executives"]}
    >
      <ArticleP>
        Most pipeline advice is written for sales teams closing dozens of deals a month. A consulting or agency
        business doesn&rsquo;t work that way — new business might come from three or four active conversations at
        any given time, each one built on a referral, a past relationship, or a long runway of trust-building. You
        don&rsquo;t need a twelve-stage enterprise pipeline. You need a simple, honest view of who you&rsquo;re
        talking to and what needs to happen next.
      </ArticleP>

      <ArticleH2>A pipeline structure that actually fits consulting sales</ArticleH2>
      <ArticleP>
        A pipeline with too many stages becomes busywork — you spend more time updating it than using it. A pipeline
        with too few stages tells you nothing. Five stages is usually the right amount of resolution for a service
        business:
      </ArticleP>
      <ArticleUL>
        <li><strong>New lead</strong> — a name and a reason to believe there&rsquo;s a fit, nothing committed yet.</li>
        <li><strong>Discovery call scheduled or completed</strong> — you understand their problem and they understand your approach.</li>
        <li><strong>Proposal sent</strong> — scope, price, and timeline are in front of them.</li>
        <li><strong>Verbal or contract pending</strong> — the decision has effectively been made, paperwork is catching up.</li>
        <li><strong>Won (converted to client)</strong> — the point where pipeline hands off to active client work.</li>
      </ArticleUL>

      <ArticleH2>The part most people get wrong: what happens after &ldquo;won&rdquo;</ArticleH2>
      <ArticleP>
        A lot of pipeline tools treat &ldquo;won&rdquo; as the finish line — the deal closes, and the CRM&rsquo;s job
        is basically done. For a service business, that&rsquo;s backwards. The close is the start of the actual
        relationship:{" "}
        <Link href="/resources/client-onboarding-checklist" className="text-burnt-600 underline hover:text-burnt-700">
          onboarding
        </Link>
        , meeting notes, recurring revenue,{" "}
        <Link href="/resources/lead-follow-up-strategies" className="text-burnt-600 underline hover:text-burnt-700">
          follow-ups
        </Link>
        . If your pipeline and your client
        management live in separate tools, that handoff is where information gets lost — the context from
        discovery calls doesn&rsquo;t make it into the client record, and you&rsquo;re starting the relationship
        with amnesia about how it began.
      </ArticleP>

      <ArticleH2>Stalled leads deserve their own attention</ArticleH2>
      <ArticleP>
        Not every lead moves cleanly through five stages. Some go quiet after a great discovery call. Some sit on a
        proposal for six weeks. The businesses that convert well aren&rsquo;t the ones with the fanciest pipeline —
        they&rsquo;re the ones with a simple habit of reviewing stalled leads weekly and deciding, deliberately,
        whether to follow up, adjust the offer, or let it go. A pipeline you never look at is worse than no pipeline
        at all, because it creates a false sense that leads are being managed.
      </ArticleP>

      <ArticleH2>Keep it connected to the rest of the business</ArticleH2>
      <ArticleP>
        The real value of a pipeline for a consulting business isn&rsquo;t the stages — it&rsquo;s what happens when
        a lead converts. Verclara&rsquo;s Leads &amp; Pipeline is built around exactly that handoff: a lead converts
        into a client record with its history intact, so the relationship you&rsquo;ve been building doesn&rsquo;t
        start over the moment the contract is signed.
      </ArticleP>
    </ArticleLayout>
  );
}
