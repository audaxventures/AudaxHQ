import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout, ArticleH2, ArticleP, ArticleUL } from "@/components/site/ArticleLayout";

const SLUG = "track-client-profitability";
const DISPLAY_TITLE = "How to Track Client Profitability Without a Finance Team";
const TITLE = `${DISPLAY_TITLE} — Verclara`;
const DESCRIPTION =
  "A practical way for solo consultants and small agencies to see which clients are actually making money.";
const CATEGORY = "Profitability";
const PUBLISHED_AT = "2026-06-05";
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
      relatedSlugs={["time-tracking-for-client-projects", "how-to-invoice-clients-as-a-consultant", "best-crm-for-fractional-executives"]}
    >
      <ArticleP>
        Revenue and profitability are not the same number, and for service businesses that gap can be dangerously
        invisible. A client paying you $8,000 a month looks great on the invoice list. It looks a lot less great once
        you account for the twelve hours a week you&rsquo;re quietly spending on scope creep that was never billed.
        Most consultants and small agencies don&rsquo;t have a finance team to catch this — which means it usually
        goes unnoticed until the business feels busier than it is profitable.
      </ArticleP>

      <ArticleH2>Why revenue alone is a misleading number</ArticleH2>
      <ArticleP>
        Revenue tells you what came in. It doesn&rsquo;t tell you what it cost you to deliver it — in hours, in
        contractor fees, in fixed costs allocated across clients. Two clients paying the same monthly retainer can
        have wildly different profitability if one takes five hours a week and the other takes twenty. Without
        tracking cost against each client individually, both look identical on a revenue report.
      </ArticleP>

      <ArticleH2>The minimum you need to track</ArticleH2>
      <ArticleUL>
        <li>
          <strong>
            <Link href="/resources/time-tracking-for-client-projects" className="text-burnt-600 underline hover:text-burnt-700">
              Time spent per client
            </Link>
            ,
          </strong>{" "}
          logged consistently enough to be trustworthy — even a rough weekly estimate beats no tracking at all.
        </li>
        <li>
          <strong>Fixed and variable costs tied to each client,</strong> like contractor hours, software seats, or
          ad spend you manage on their behalf.
        </li>
        <li>
          <strong>Revenue recognized per client per month,</strong> not just total revenue across the business.
        </li>
        <li>
          <strong>An effective hourly rate,</strong> calculated as (revenue &minus; costs) &divide; hours spent — the
          single number that tells you the truth fastest.
        </li>
      </ArticleUL>

      <ArticleH2>What this actually reveals</ArticleH2>
      <ArticleP>
        When consultants run this exercise for the first time, the results are rarely what they expected. It&rsquo;s
        common to discover that a client you&rsquo;ve been treating as a flagship account is actually one of your
        least profitable relationships once real hours are accounted for — while a smaller, quieter client is
        quietly subsidizing the business. That information changes decisions: which clients to renew, which to
        renegotiate, and which scope creep to finally push back on.
      </ArticleP>

      <ArticleH2>Why spreadsheets make this harder than it needs to be</ArticleH2>
      <ArticleP>
        In theory, a{" "}
        <Link href="/resources/business-operating-system-vs-spreadsheets" className="text-burnt-600 underline hover:text-burnt-700">
          spreadsheet
        </Link>{" "}
        can track all of this. In practice, it rarely gets kept up to date, because logging
        time in one place and costs in another and revenue in a third means the profitability picture is always a
        week behind — and reconstructing it takes an afternoon nobody has. The businesses that actually track
        profitability well are the ones where time, costs, and revenue live against the same client record
        automatically, so the number is always current without extra work.
      </ArticleP>
      <ArticleP>
        That&rsquo;s the specific problem Verclara&rsquo;s Hour &amp; Cost Tracker and Revenue Tracking are built to
        solve — time, fixed costs, and revenue rolled up per client, so profitability is a number you can see, not one
        you have to reconstruct.
      </ArticleP>
    </ArticleLayout>
  );
}
