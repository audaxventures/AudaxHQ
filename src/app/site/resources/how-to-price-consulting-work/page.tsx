import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout, ArticleH2, ArticleP } from "@/components/site/ArticleLayout";

const SLUG = "how-to-price-consulting-work";
const DISPLAY_TITLE = "How to Price Consulting Work Without Underselling Yourself";
const TITLE = `${DISPLAY_TITLE} — Verclara`;
const DESCRIPTION =
  "Hourly rates quietly cap what you can earn — here's how to price consulting work around the value you deliver instead of the hours you log.";
const CATEGORY = "Pricing";
const PUBLISHED_AT = "2026-08-14";
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
      relatedSlugs={["consulting-proposal-template", "track-client-profitability", "turning-clients-into-retainers"]}
    >
      <ArticleP>
        Most consultants set their rate once, early on, usually by guessing at a number that felt defensible at the
        time, and then never really revisit the logic behind it. The rate creeps up a little each year, but the
        method behind it never changes. That&rsquo;s how someone ends up three years and a much stronger track
        record later, still pricing like they did when they were trying to land their first client. Pricing
        isn&rsquo;t a number you pick — it&rsquo;s a decision you have to keep making, and most consultants are
        underselling themselves simply because they never built a real process for making it.
      </ArticleP>

      <ArticleH2>Why hourly billing quietly caps your income</ArticleH2>
      <ArticleP>
        Hourly billing feels safe because it&rsquo;s easy to justify — the client sees the math, and you get paid
        for time spent. But it puts a hard ceiling on your income that has nothing to do with how much value you
        create. There are only so many hours in a week, so the only way to earn more is to raise your rate or work
        more hours, and both have limits. Worse, hourly billing punishes you for getting faster. The more efficient
        you become at a type of engagement, the less you earn from it, because you&rsquo;re now solving the same
        problem in less billable time. That&rsquo;s backwards — your experience should be worth more, not less.
      </ArticleP>
      <ArticleP>
        Hourly also frames the relationship around your time instead of the client&rsquo;s outcome, which makes it
        harder to have a pricing conversation rooted in results. A client questioning your hours is a much worse
        conversation than a client evaluating whether an outcome was worth what they paid for it.
      </ArticleP>

      <ArticleH2>The three pricing models, and when each one fits</ArticleH2>
      <ArticleP>
        Fixed-fee pricing quotes a flat price for a defined scope. It works well when the scope is genuinely knowable
        upfront — a discrete project with clear boundaries, like a system implementation or a one-time audit. The
        risk sits entirely on you if the scope creeps, which is why fixed-fee work only holds up when it&rsquo;s
        paired with a tight{" "}
        <Link href="/resources/how-to-handle-scope-creep" className="text-burnt-600 underline hover:text-burnt-700">
          scope definition
        </Link>{" "}
        and a clear process for handling anything that falls outside it.
      </ArticleP>
      <ArticleP>
        Value-based pricing ties the fee to the outcome the client gets, not the hours or deliverables involved.
        It&rsquo;s the hardest model to execute well because it requires you to actually understand and quantify the
        client&rsquo;s problem before you price it, but it&rsquo;s also the model with the highest ceiling —
        there&rsquo;s no hourly cap when the price is anchored to a result worth far more than your time. It fits
        best with clients who have a measurable problem: revenue you can grow, costs you can cut, risk you can
        remove.
      </ArticleP>
      <ArticleP>
        Retainers charge a recurring fee for ongoing access, capacity, or a defined scope of continuous work.
        They&rsquo;re the most stable model for cash flow and the easiest to plan around, which is why turning good
        project clients into retainer relationships is usually worth pursuing even when the retainer itself pays
        less per hour than project work would.
      </ArticleP>
      <ArticleP>
        Most consultants end up running a mix of all three depending on the client and the engagement, rather than
        picking one model and forcing every deal into it.
      </ArticleP>

      <ArticleH2>Price around the outcome, not the effort</ArticleH2>
      <ArticleP>
        The mistake in most pricing conversations is starting from your side of the table — what you think your
        time is worth — instead of the client&rsquo;s side, which is what the outcome is worth to them. A project
        that takes you twenty hours and saves a client $200,000 a year isn&rsquo;t a twenty-hour project. It&rsquo;s
        a $200,000-problem project, and it should be priced closer to that number than to your hourly rate times
        twenty.
      </ArticleP>
      <ArticleP>
        Getting there requires asking better questions before you scope anything: what does this problem cost them
        today, what happens if it doesn&rsquo;t get solved, and what would solving it be worth over the next year.
        Those numbers rarely come from the client unprompted — you have to ask for them directly during the sales
        conversation, before you&rsquo;re deep enough into the relationship that raising the topic feels
        transactional.
      </ArticleP>
      <ArticleP>
        This is also where a well-built{" "}
        <Link href="/resources/consulting-proposal-template" className="text-burnt-600 underline hover:text-burnt-700">
          proposal
        </Link>{" "}
        earns its keep. A proposal that opens with the cost of the problem and the value of solving it gives the
        client a frame to evaluate your price against — instead of comparing it to what a freelancer on a
        marketplace might charge for the same hours.
      </ArticleP>

      <ArticleH2>Have the pricing conversation with a straight face</ArticleH2>
      <ArticleP>
        The number matters less than how you deliver it. A rate stated with hesitation invites negotiation even when
        the client had no intention of pushing back — people read confidence as a proxy for whether the price is
        fair. State the number, explain briefly what it&rsquo;s based on, and stop talking. The instinct to keep
        filling the silence after naming a price is almost always self-sabotage; it signals you&rsquo;re not sure
        the number holds up.
      </ArticleP>
      <ArticleP>
        If a client pushes back, the response isn&rsquo;t to drop the price — it&rsquo;s to adjust the scope.
        Removing something from the engagement to hit a lower number keeps the price-to-value ratio intact. Simply
        discounting the same scope trains the client to expect a discount every time, and quietly tells them the
        original number wasn&rsquo;t real to begin with.
      </ArticleP>

      <ArticleH2>Raising prices with clients you already have</ArticleH2>
      <ArticleP>
        Existing clients are usually the most underpriced part of a consultant&rsquo;s book, because the rate was
        set at the start of the relationship and never revisited even as the value delivered kept growing. Raising
        prices with a current client is a different conversation than pricing a new one — it should be anchored in
        what&rsquo;s changed: more scope, more impact, more history that makes you faster and more valuable to work
        with, not just &ldquo;it&rsquo;s been a year.&rdquo; A short heads-up ahead of a renewal, tied to specifics,
        lands far better than a number that shows up quietly on the next invoice with no explanation.
      </ArticleP>
      <ArticleP>
        This connects directly to{" "}
        <Link href="/resources/client-retention-strategies" className="text-burnt-600 underline hover:text-burnt-700">
          retention
        </Link>{" "}
        — clients rarely leave over a reasonable increase tied to real value. They leave when the increase feels
        arbitrary, or when it&rsquo;s the first time price has ever come up as a topic at all.
      </ArticleP>

      <ArticleH2>Check whether your pricing is actually working</ArticleH2>
      <ArticleP>
        None of this matters if you&rsquo;re not tracking whether it&rsquo;s translating into real margin. A rate
        that looks strong on a proposal can still lose money once you account for how much unbilled time a client
        actually consumes — scope creep, extra calls, revisions that were never priced in. Tracking{" "}
        <Link href="/resources/track-client-profitability" className="text-burnt-600 underline hover:text-burnt-700">
          profitability at the client level
        </Link>{" "}
        is what tells you whether your pricing model is holding up in practice, not just in theory, and it&rsquo;s
        usually the fastest way to spot which pricing decisions to repeat and which ones to stop making.
      </ArticleP>
      <ArticleP>
        Pricing isn&rsquo;t a one-time decision — it&rsquo;s a habit of asking, on a regular basis, whether the
        number still reflects the value on the table. Consultants who revisit it deliberately tend to earn
        meaningfully more than consultants with the exact same skills who just never got around to asking.
      </ArticleP>
    </ArticleLayout>
  );
}
