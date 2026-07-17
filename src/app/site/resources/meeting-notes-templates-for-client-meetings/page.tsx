import type { Metadata } from "next";
import { ArticleLayout, ArticleH2, ArticleP, ArticleUL } from "@/components/site/ArticleLayout";

const SLUG = "meeting-notes-templates-for-client-meetings";
const DISPLAY_TITLE = "Meeting Notes Templates Every Client-Facing Business Should Use";
const TITLE = `${DISPLAY_TITLE} — Verclara`;
const DESCRIPTION =
  "A repeatable structure for client meeting notes that makes follow-ups, accountability, and handoffs easier.";
const CATEGORY = "Meeting Notes";
const PUBLISHED_AT = "2026-06-29";
const READING_MINUTES = 4;

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
        Good meeting notes aren&rsquo;t a transcript — they&rsquo;re a decision record. The point isn&rsquo;t to
        capture everything that was said; it&rsquo;s to capture what was decided, who owns what next, and enough
        context that anyone reading them in three months understands why. Most client-facing teams write notes that
        do neither well — too sparse to be useful later, or too long for anyone to actually reread.
      </ArticleP>

      <ArticleH2>A structure that holds up over time</ArticleH2>
      <ArticleUL>
        <li><strong>Attendees and date</strong> — obvious, but the first thing you&rsquo;ll need when searching later.</li>
        <li><strong>Agenda or purpose</strong> — one line on why the meeting happened, for context months later.</li>
        <li><strong>Key decisions</strong> — what was actually agreed, stated plainly, not buried in narrative.</li>
        <li><strong>Action items with owners and dates</strong> — not &ldquo;we&rsquo;ll look into it,&rdquo; but a name and a deadline.</li>
        <li><strong>Open questions</strong> — anything unresolved, so it doesn&rsquo;t quietly disappear.</li>
      </ArticleUL>

      <ArticleH2>Why &ldquo;we&rsquo;ll follow up&rdquo; is where accountability dies</ArticleH2>
      <ArticleP>
        The single biggest failure in client meeting notes is vague ownership. &ldquo;We&rsquo;ll get back to you on
        pricing&rdquo; written down as an action item is functionally useless — it has no owner and no deadline, so
        it has no accountability. The fix is mechanical: every action item gets a name and a date, every time,
        without exception. It feels like a small discipline. It&rsquo;s the difference between notes that drive
        follow-through and notes that just document that a meeting happened.
      </ArticleP>

      <ArticleH2>Notes that live with the client, not in a separate app</ArticleH2>
      <ArticleP>
        Meeting notes are most useful when they&rsquo;re easy to find in context — attached to the client they&rsquo;re
        about, not buried in a shared drive folder structure or a note-taking app disconnected from everything else
        you know about that relationship. When notes live separately from the client record, the habit of writing
        them thoroughly tends to fade, because the payoff (being able to find them later) feels less certain.
      </ArticleP>

      <ArticleH2>Turning notes into action, automatically</ArticleH2>
      <ArticleP>
        The best meeting notes system is one where writing the note and creating the follow-up are the same motion,
        not two separate steps you have to remember to do. Verclara&rsquo;s meeting notes live directly on the
        client record, with agenda and action items as dedicated fields — so a decision made in a Tuesday call turns
        into a tracked follow-up without a second trip to a different tool.
      </ArticleP>
    </ArticleLayout>
  );
}
