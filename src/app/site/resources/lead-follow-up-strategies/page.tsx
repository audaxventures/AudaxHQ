import type { Metadata } from "next";
import { ArticleLayout, ArticleH2, ArticleP, ArticleUL } from "@/components/site/ArticleLayout";

const SLUG = "lead-follow-up-strategies";
const DISPLAY_TITLE = "Lead Follow-Up Strategies That Turn Prospects Into Paying Clients";
const TITLE = `${DISPLAY_TITLE} — Verclara`;
const DESCRIPTION = "Most leads are lost to silence, not rejection. Here's a follow-up system that keeps opportunities alive.";
const CATEGORY = "Lead Follow-Up";
const PUBLISHED_AT = "2026-06-21";
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
    >
      <ArticleP>
        Ask most consultants why a lead didn&rsquo;t become a client, and the honest answer is rarely &ldquo;they said
        no.&rdquo; It&rsquo;s usually that the conversation just... stopped. A great discovery call happens, a
        proposal goes out, and then life gets busy on both sides — and without a deliberate follow-up, silence
        quietly becomes a lost deal that was never actually rejected.
      </ArticleP>

      <ArticleH2>Why follow-up feels awkward — and why that&rsquo;s the wrong instinct</ArticleH2>
      <ArticleP>
        Most people under-follow-up because it feels like pestering. In reality, a well-timed, genuinely useful
        follow-up is rarely unwelcome — buyers are busy, not uninterested, and a reminder that respects their time is
        doing them a favor. The goal isn&rsquo;t to follow up more aggressively. It&rsquo;s to follow up
        consistently, on a schedule that doesn&rsquo;t depend on you happening to remember.
      </ArticleP>

      <ArticleH2>A follow-up cadence that works for service businesses</ArticleH2>
      <ArticleUL>
        <li><strong>Day 2 after a proposal:</strong> a short note confirming it arrived and asking if anything needs clarifying.</li>
        <li><strong>Day 7:</strong> a specific, useful check-in — a relevant insight, a related case, or a direct question about timeline.</li>
        <li><strong>Day 14:</strong> a lower-pressure touchpoint — checking whether priorities have shifted, and if now still isn&rsquo;t the right time, when might be.</li>
        <li><strong>Day 30:</strong> move to a longer-term nurture rather than active pursuit — but don&rsquo;t delete the lead.</li>
      </ArticleUL>

      <ArticleH2>The real failure point isn&rsquo;t the message — it&rsquo;s the reminder</ArticleH2>
      <ArticleP>
        Almost every consultant already knows they should follow up. What breaks down is remembering to, at the
        right time, for the right lead, out of a dozen other things competing for attention that week. A follow-up
        strategy only works if it doesn&rsquo;t depend on memory — which means it needs to live somewhere that
        surfaces &ldquo;follow up with this lead today&rdquo; without you having to think to check.
      </ArticleP>

      <ArticleH2>Stalled leads need a decision, not just a reminder</ArticleH2>
      <ArticleP>
        Not every lead is worth chasing indefinitely. Part of a good follow-up system is a regular review — weekly
        or biweekly — where stalled leads get a deliberate decision: keep pursuing, deprioritize, or close it out.
        A pipeline full of leads nobody has looked at in two months isn&rsquo;t a pipeline, it&rsquo;s a graveyard.
      </ArticleP>
      <ArticleP>
        This is precisely what Verclara&rsquo;s follow-up tracking is built to prevent — every lead and client can
        carry a scheduled follow-up that surfaces automatically, so consistency doesn&rsquo;t depend on remembering
        who you talked to three weeks ago.
      </ArticleP>
    </ArticleLayout>
  );
}
