import type { Metadata } from "next";
import { ArticleLayout, ArticleH2, ArticleP, ArticleUL } from "@/components/site/ArticleLayout";

const SLUG = "time-tracking-for-client-projects";
const DISPLAY_TITLE = "Time Tracking for Client Projects: How to Stop Losing Billable Hours";
const TITLE = `${DISPLAY_TITLE} — Verclara`;
const DESCRIPTION =
  "Why service businesses under-bill without realizing it, and a lightweight way to track time that people actually keep up with.";
const CATEGORY = "Time Tracking";
const PUBLISHED_AT = "2026-06-17";
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
        Most service businesses lose billable hours not through big mistakes, but through a hundred small ones —
        the fifteen-minute call that never gets logged, the &ldquo;quick question&rdquo; email thread that eats an
        hour, the scope creep that feels too small to track. None of it looks significant in the moment. Added up
        over a quarter, it&rsquo;s often the difference between a healthy margin and a break-even one.
      </ArticleP>

      <ArticleH2>Why time tracking gets abandoned</ArticleH2>
      <ArticleP>
        Almost everyone starts time tracking with good intentions. It usually falls apart for one of two reasons:
        the tool is disconnected from the actual work (a separate app, a separate login, a separate mental context
        switch), or the categories are too granular to bother with in the moment. If logging time takes longer than
        the task itself felt like it was worth, it stops happening — quietly, a few weeks in, and nobody notices
        until profitability looks worse than expected.
      </ArticleP>

      <ArticleH2>What makes time tracking actually stick</ArticleH2>
      <ArticleUL>
        <li>
          <strong>Log time where the work already lives.</strong> If you&rsquo;re already on a client&rsquo;s record
          for meeting notes or tasks, logging time there takes seconds — a separate app adds friction that adds up.
        </li>
        <li>
          <strong>Keep categories simple.</strong> Client, task type, and duration is usually enough. You don&rsquo;t
          need fifteen-minute increments and a taxonomy of billing codes to get a useful picture.
        </li>
        <li>
          <strong>Log at the end of each work block, not at the end of the week.</strong> Reconstructing a week of
          work from memory on Friday afternoon is where most inaccuracy creeps in.
        </li>
        <li>
          <strong>Make it visible, not just recorded.</strong> A running total per client — hours this month, cost
          against revenue — turns tracking from an administrative chore into information you actually use.
        </li>
      </ArticleUL>

      <ArticleH2>The billing conversation time tracking makes easier</ArticleH2>
      <ArticleP>
        Accurate time tracking isn&rsquo;t just about not losing money — it&rsquo;s about having real data when a
        client&rsquo;s scope quietly expands. &ldquo;This has grown from ten hours a month to eighteen&rdquo; is a
        much easier conversation to have with a log behind it than as a vague feeling you can&rsquo;t quite prove.
        Consultants who track time consistently renegotiate scope more confidently, because the numbers do the
        talking.
      </ArticleP>

      <ArticleH2>Where this fits into the bigger picture</ArticleH2>
      <ArticleP>
        Time tracking is most useful when it connects directly to cost and revenue — otherwise it&rsquo;s just a log
        nobody revisits. Verclara&rsquo;s Hour &amp; Cost Tracker logs time against the same client record you&rsquo;re
        already working from, and rolls it straight into profitability, so tracking time and understanding what
        it&rsquo;s actually costing you happen in the same place.
      </ArticleP>
    </ArticleLayout>
  );
}
