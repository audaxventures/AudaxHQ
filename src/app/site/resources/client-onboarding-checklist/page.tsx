import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout, ArticleH2, ArticleP, ArticleUL } from "@/components/site/ArticleLayout";

const SLUG = "client-onboarding-checklist";
const DISPLAY_TITLE = "The Client Onboarding Checklist Every Service Business Needs";
const TITLE = `${DISPLAY_TITLE} — Verclara`;
const DESCRIPTION =
  "The exact steps to take in the first week of a new client engagement so nothing falls through the cracks.";
const CATEGORY = "Client Onboarding";
const PUBLISHED_AT = "2026-06-13";
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
      relatedSlugs={["meeting-notes-templates-for-client-meetings", "sales-pipeline-for-consulting-business", "team-management-for-small-agencies"]}
    >
      <ArticleP>
        The first two weeks of a client relationship set the tone for everything after it. A smooth onboarding tells
        a new client they made the right call. A messy one — missed details, repeated questions, a slow start —
        plants a seed of doubt that&rsquo;s hard to shake even if the actual work is excellent. And yet onboarding is
        often the least systemized part of a service business, because every new client feels like a one-off.
      </ArticleP>
      <ArticleP>
        It shouldn&rsquo;t be. Here&rsquo;s a checklist that works whether you&rsquo;re a solo consultant or a small
        agency team.
      </ArticleP>

      <ArticleH2>Before the first working session</ArticleH2>
      <ArticleUL>
        <li>Confirm scope, deliverables, and timeline in writing — even if it was agreed verbally.</li>
        <li>Set up the client record with key contacts, billing details, and how they prefer to communicate.</li>
        <li>Send a short welcome message that sets expectations for the first 30 days.</li>
        <li>Schedule the kickoff meeting and share an agenda in advance, so it isn&rsquo;t improvised.</li>
      </ArticleUL>

      <ArticleH2>During the kickoff meeting</ArticleH2>
      <ArticleUL>
        <li>Confirm goals in the client&rsquo;s own words — not your interpretation of the goals.</li>
        <li>Identify who else on their side needs to be involved, and how decisions actually get made.</li>
        <li>Agree on a communication cadence: weekly check-in, async updates, or both.</li>
        <li>Write down action items immediately, with owners and dates — not &ldquo;we&rsquo;ll follow up.&rdquo;</li>
      </ArticleUL>

      <ArticleH2>In the first two weeks</ArticleH2>
      <ArticleUL>
        <li>Deliver one small, visible win early — momentum matters more than completeness at this stage.</li>
        <li>Set a recurring follow-up cadence so check-ins happen by default, not by memory.</li>
        <li>
          Confirm{" "}
          <Link href="/resources/how-to-invoice-clients-as-a-consultant" className="text-burnt-600 underline hover:text-burnt-700">
            invoicing
          </Link>{" "}
          details are correct before the first invoice goes out.
        </li>
        <li>Do a short internal review: is anything about this engagement different from what was scoped?</li>
      </ArticleUL>

      <ArticleH2>Why onboarding breaks down in practice</ArticleH2>
      <ArticleP>
        Almost nobody skips onboarding on purpose. It breaks down because the checklist lives in someone&rsquo;s head,
        the notes from the kickoff call live in a doc nobody reopens, and the follow-up reminder lives nowhere at
        all. Three clients in, the steps start getting skipped — not from carelessness, but because there&rsquo;s no
        system holding it together.
      </ArticleP>
      <ArticleP>
        A repeatable onboarding process works best when it&rsquo;s attached to the same place you&rsquo;ll manage the
        rest of the relationship —{" "}
        <Link href="/resources/meeting-notes-templates-for-client-meetings" className="text-burnt-600 underline hover:text-burnt-700">
          meeting notes
        </Link>
        , follow-ups, and tasks all on the client&rsquo;s own record, so the
        next step is always visible instead of remembered. That&rsquo;s the model Verclara is built around: every new
        client starts as one workspace where onboarding tasks, meeting notes, and follow-ups don&rsquo;t need a
        separate checklist app to stay on track.
      </ArticleP>
    </ArticleLayout>
  );
}
