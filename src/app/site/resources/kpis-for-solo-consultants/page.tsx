import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout, ArticleH2, ArticleP } from "@/components/site/ArticleLayout";

const SLUG = "kpis-for-solo-consultants";
const DISPLAY_TITLE = "The KPIs Every Solo Consultant and Small Agency Should Actually Track";
const TITLE = `${DISPLAY_TITLE} — Verclara`;
const DESCRIPTION = "Most of the numbers you could track don't matter — here's the short list that actually tells you how the business is doing.";
const CATEGORY = "KPIs & Metrics";
const PUBLISHED_AT = "2026-08-24";
const READING_MINUTES = 5;

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
      relatedSlugs={["track-client-profitability", "sales-pipeline-for-consulting-business", "time-tracking-for-client-projects"]}
    >
      <ArticleP>
        Ask a solo consultant how the business is doing and you&rsquo;ll usually get a gut-check answer:
        &ldquo;busy,&rdquo; &ldquo;slow,&rdquo; &ldquo;fine, I think.&rdquo; Not because they&rsquo;re careless, but
        because most of the numbers that would give a real answer live in five different places — a bank account, a
        time tracker, a CRM that half-updates itself, a spreadsheet nobody&rsquo;s opened since March.
        Reconstructing the picture takes an hour nobody has, so it doesn&rsquo;t happen, and the business gets run on
        vibes until a bad quarter forces the issue.
      </ArticleP>
      <ArticleP>
        The fix isn&rsquo;t tracking more. It&rsquo;s tracking the handful of numbers that actually predict trouble
        before it shows up in the bank balance, and ignoring the dashboard-shaped noise that agencies twice your size
        use to justify a BI hire.
      </ArticleP>

      <ArticleH2>Why solo operators avoid this, and why it costs them</ArticleH2>
      <ArticleP>
        Most KPI advice is written for companies with a finance team and a data analyst, which makes it useless — or
        actively distracting — for someone billing their own hours and closing their own deals. So the instinct is
        to skip metrics entirely and just watch the bank account. The problem is the bank account is a lagging
        indicator. By the time revenue actually drops, the pipeline that should have replaced it went quiet two
        months earlier, and nobody noticed because nobody was watching the number that would have flagged it.
      </ArticleP>
      <ArticleP>
        The businesses that avoid the feast-or-famine cycle aren&rsquo;t the ones working harder. They&rsquo;re the
        ones who caught the slowdown in the leading indicators — a thinning pipeline, a slipping response time on new
        leads — while there was still runway to fix it.
      </ArticleP>

      <ArticleH2>Revenue and utilization: the two numbers that set the floor</ArticleH2>
      <ArticleP>
        Start with utilization — the percentage of your available hours that are actually billable. This is the
        number that tells you whether you have a capacity problem or a sales problem, and most solo consultants have
        never calculated it. If utilization is high and revenue still feels tight, the issue is pricing, not
        pipeline. If utilization is low, more leads won&rsquo;t fix anything until you figure out why the hours
        aren&rsquo;t converting to work.
      </ArticleP>
      <ArticleP>
        Pair it with revenue per client, tracked monthly, not just at invoice time. A single number for &ldquo;total
        revenue&rdquo; hides the thing that actually matters: whether your income is concentrated in one or two
        accounts that could walk away at any time, or spread across a base that can absorb a loss.{" "}
        <Link href="/resources/track-client-profitability" className="text-burnt-600 underline hover:text-burnt-700">
          Tracking profitability at the client level
        </Link>{" "}
        — not just revenue — goes a step further and tells you which of those clients are actually worth keeping
        once you account for the time they eat.
      </ArticleP>

      <ArticleH2>Pipeline health: the number that predicts next quarter, not this one</ArticleH2>
      <ArticleP>
        Revenue tells you how last month went. Pipeline tells you how next quarter is going to go, which is why
        it&rsquo;s the metric most solo operators neglect until it&rsquo;s too late. Two numbers matter here more
        than the rest: the number of qualified opportunities currently in motion, and the average time a lead sits
        before you follow up.
      </ArticleP>
      <ArticleP>
        That second one is underrated. A lead that sits three days before hearing back from you is a different
        opportunity than one you respond to in three hours — not because of eagerness, but because most buying
        decisions happen while the need is still top of mind. If you don&rsquo;t know your average response time,
        it&rsquo;s very likely worse than you&rsquo;d guess, and it&rsquo;s costing you deals you never find out you
        lost. This is the same discipline behind good lead follow-up: the metric exists to catch a habit you
        can&rsquo;t see from inside it.
      </ArticleP>
      <ArticleP>
        Track pipeline value by stage, too, but don&rsquo;t over-engineer it. Three stages — contacted, proposal out,
        verbal commitment — is enough resolution for a business run by one or two people. A twelve-stage funnel built
        for an enterprise sales team is a project management exercise, not a KPI.
      </ArticleP>

      <ArticleH2>Delivery metrics: the ones that protect margin</ArticleH2>
      <ArticleP>
        On the delivery side, the metric that matters most is budget-to-actual on billable hours — how many hours you
        estimated for an engagement versus how many it actually took. This is the number that quietly erodes margin
        on fixed-fee work if nobody&rsquo;s watching it, because a project that runs 20% over on hours is a project
        you effectively discounted by 20%, even though the invoice looked the same.
      </ArticleP>
      <ArticleP>
        Time tracked against budget also gives you the earliest possible warning on{" "}
        <Link href="/resources/how-to-handle-scope-creep" className="text-burnt-600 underline hover:text-burnt-700">
          scope creep
        </Link>{" "}
        — long before the client relationship shows any strain. If you&rsquo;re three weeks into a four-week
        engagement and you&rsquo;ve already burned 90% of the estimated hours, that&rsquo;s a data point, not a
        feeling, and it&rsquo;s one you can act on before the project quietly runs at a loss.
      </ArticleP>

      <ArticleH2>Client health: the metric that protects revenue you already have</ArticleH2>
      <ArticleP>
        New business gets the attention because it&rsquo;s exciting; retention gets ignored because it&rsquo;s
        assumed. But the cheapest revenue you&rsquo;ll ever generate is revenue from a client you already have, which
        makes client health worth tracking as deliberately as pipeline. The simplest version of this is a renewal or
        retainer conversion rate — of the engagements that ended this quarter, how many turned into more work, and
        how many just ended.
      </ArticleP>
      <ArticleP>
        A number trending down here is an early signal of a churn problem long before a client actually says
        goodbye, and it&rsquo;s worth cross-referencing against how consistently you&rsquo;re sending{" "}
        <Link href="/resources/client-status-updates" className="text-burnt-600 underline hover:text-burnt-700">
          client status updates
        </Link>{" "}
        — engagements with a steady communication cadence convert to renewals and retainers at a noticeably higher
        rate than ones running dark between milestones.
      </ArticleP>

      <ArticleH2>Keep the list short</ArticleH2>
      <ArticleP>
        The failure mode with KPIs isn&rsquo;t tracking too few — it&rsquo;s building a dashboard with twenty metrics
        that nobody checks after the first week. Five or six numbers, reviewed on a fixed weekly or monthly cadence,
        will tell a solo consultant or small agency almost everything that matters: utilization, revenue per client,
        pipeline value and response time, budget-to-actual on active engagements, and a renewal or retainer
        conversion rate. Everything past that is a nice-to-have.
      </ArticleP>
      <ArticleP>
        The other requirement is that the numbers have to be cheap to check. If pulling utilization means
        cross-referencing a time tracker against a calendar by hand, it won&rsquo;t get checked past the second
        month. When client records, time entries, pipeline stage, and revenue all live in the same workspace, these
        numbers are a glance instead of a project — which is the only way a KPI review actually survives contact
        with a busy week.
      </ArticleP>
    </ArticleLayout>
  );
}
