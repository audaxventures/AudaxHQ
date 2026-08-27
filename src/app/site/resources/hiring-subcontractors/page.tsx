import type { Metadata } from "next";
import Link from "next/link";
import { ArticleLayout, ArticleH2, ArticleP, ArticleUL } from "@/components/site/ArticleLayout";

const SLUG = "hiring-subcontractors";
const DISPLAY_TITLE = "How to Hire Subcontractors Without Losing Control of Client Quality";
const TITLE = `${DISPLAY_TITLE} — Verclara`;
const DESCRIPTION =
  "Bringing on subcontractors solves a capacity problem and creates a quality-control one — here's how to do it without either one costing you the client.";
const CATEGORY = "Subcontractors";
const PUBLISHED_AT = "2026-08-27";
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
      relatedSlugs={["team-management-for-small-agencies", "how-fractional-executives-scale", "track-client-profitability"]}
    >
      <ArticleP>
        The decision to bring on a subcontractor usually isn&rsquo;t really a decision — it&rsquo;s a deadline
        forcing your hand. A client wants to move faster than you can deliver solo, or two engagements collided on
        the calendar at once, and the fastest fix is to bring in someone else&rsquo;s hands. That urgency is exactly
        why it goes wrong so often. The vetting gets rushed, the handoff gets rushed, and six weeks later
        you&rsquo;re rewriting a deliverable at 11pm because what came back doesn&rsquo;t sound like your work —
        because it isn&rsquo;t.
      </ArticleP>
      <ArticleP>
        None of this is an argument against subcontracting. It&rsquo;s the only way most solo consultants and small
        agencies scale past what one person can bill. The problem isn&rsquo;t the subcontractor. It&rsquo;s that
        most consultants build the relationship the way they&rsquo;d hire a favor, not the way they&rsquo;d run a
        client engagement — and quality only holds up when it&rsquo;s treated as the second one.
      </ArticleP>

      <ArticleH2>Vet for judgment, not just skill</ArticleH2>
      <ArticleP>
        Skill is the easy part to check. Ask for samples, ask for references, look at past work — most consultants
        already do this much. What gets skipped is judgment: whether this person knows what to do when the brief is
        ambiguous, when a deadline is at risk, or when something looks off but isn&rsquo;t explicitly their job to
        flag. That&rsquo;s the part that actually determines whether a client notices the handoff happened.
      </ArticleP>
      <ArticleP>
        A short paid trial project surfaces this faster than any conversation will. Give them something real but
        low-stakes, with a deadline and a gap in the instructions on purpose, and watch what they do with the gap.
        Do they guess and ship it, or do they ask the one good question that shows they understood the actual goal?
        A few signals are worth watching for specifically:
      </ArticleP>
      <ArticleUL>
        <li>
          <strong className="text-navy-900">They ask about the client, not just the deliverable.</strong> Someone
          who wants to understand who this is for and why is thinking about outcomes. Someone who only asks about
          format is thinking about the task.
        </li>
        <li>
          <strong className="text-navy-900">They flag risk before you do.</strong> A subcontractor who says
          &ldquo;this timeline is tight if X happens&rdquo; before it happens is one you can hand ambiguity to
          later.
        </li>
        <li>
          <strong className="text-navy-900">They communicate proactively, not just on request.</strong> If a status
          update only comes when you chase it, that pattern won&rsquo;t improve once real client work is on the
          line.
        </li>
      </ArticleUL>
      <ArticleP>
        None of this shows up in a portfolio review. It only shows up once, under a real deadline, which is why the
        trial project earns its cost even when the finished work isn&rsquo;t billable.
      </ArticleP>

      <ArticleH2>Treat onboarding like you would for a client, because the standard is the same</ArticleH2>
      <ArticleP>
        Most consultants have some version of a{" "}
        <Link href="/resources/client-onboarding-checklist" className="text-burnt-600 underline hover:text-burnt-700">
          client onboarding process
        </Link>{" "}
        — a checklist for the first week that makes sure nothing falls through the cracks. Very few apply the same
        discipline to bringing on a subcontractor, even though the risk of something falling through the cracks is
        arguably higher, since this person is about to represent your work to someone who&rsquo;s paying you, not
        them.
      </ArticleP>
      <ArticleP>
        The onboarding that actually matters covers three things: access to the same context you&rsquo;d give
        yourself (the client history, the goals behind the engagement, not just the task list), a clear definition
        of what &ldquo;done&rdquo; looks like for this specific deliverable, and an explicit understanding of where
        their judgment ends and yours begins. That last one is the piece that prevents the worst outcome — a
        subcontractor making a client-facing call that was never theirs to make, because nobody told them it
        wasn&rsquo;t.
      </ArticleP>

      <ArticleH2>Decide whether the client knows, and be consistent about it</ArticleH2>
      <ArticleP>
        There&rsquo;s no universally right answer to whether a client should know a subcontractor is involved — some
        clients care a lot, most don&rsquo;t care at all as long as the work is good and it&rsquo;s still you
        steering the relationship. What matters more than the choice is being consistent and honest about whichever
        one you pick. Quietly outsourcing a deliverable the client believes only you touched, and having them find
        out later, damages trust in a way that&rsquo;s disproportionate to the actual quality issue, if there even
        was one.
      </ArticleP>
      <ArticleP>
        If you&rsquo;re keeping the relationship client-facing and using subcontractors behind the scenes, that only
        works if every subcontractor&rsquo;s output goes through a review pass before it reaches the client — never
        directly. That review step is the one that&rsquo;s easiest to skip when you&rsquo;re busy and hardest to
        justify skipping after something&rsquo;s gone out with the wrong tone or a factual error attached to your
        name.
      </ArticleP>

      <ArticleH2>Price the work so subcontracting protects your margin instead of eating it</ArticleH2>
      <ArticleP>
        A subcontractor rate that looks cheap on paper can still be expensive once you count the review time, the
        revision cycles, and the client-relationship risk if something ships wrong. This is where{" "}
        <Link href="/resources/track-client-profitability" className="text-burnt-600 underline hover:text-burnt-700">
          tracking profitability at the client and project level
        </Link>{" "}
        matters as much for subcontracted work as it does for your own hours — if you&rsquo;re not logging how much
        time you personally spend managing and reviewing a subcontractor&rsquo;s output, you don&rsquo;t actually
        know whether bringing them on saved you money or just moved the hours from delivery to oversight.
      </ArticleP>
      <ArticleP>
        The same{" "}
        <Link href="/resources/time-tracking-for-client-projects" className="text-burnt-600 underline hover:text-burnt-700">
          time tracking discipline
        </Link>{" "}
        that protects your own billable hours should extend to subcontractor engagements. Logging their hours
        against the same project budget you&rsquo;d use for yourself makes it visible, early, whether an engagement
        is still profitable once a second person&rsquo;s rate is factored in — instead of finding out at invoice
        time that a project you thought you&rsquo;d delegate to protect your time actually cost you more than doing
        it yourself.
      </ArticleP>

      <ArticleH2>Build oversight that scales, not oversight that becomes your new full-time job</ArticleH2>
      <ArticleP>
        The point of a subcontractor is to free up capacity, which fails completely if managing them consumes the
        capacity it was supposed to free. This is the same operational problem covered in{" "}
        <Link
          href="/resources/team-management-for-small-agencies"
          className="text-burnt-600 underline hover:text-burnt-700"
        >
          managing a small team without enterprise overhead
        </Link>
        : the fix isn&rsquo;t more check-ins, it&rsquo;s fewer places for information to hide. A subcontractor whose
        tasks, deadlines, and deliverables live in the same system as the rest of the client&rsquo;s work is one you
        can spot-check in minutes. One whose status lives in a separate email thread or a text message you have to
        go dig up is one you&rsquo;ll either over-manage out of anxiety or under-manage out of exhaustion — neither
        of which protects quality.
      </ArticleP>
      <ArticleP>
        This is also the point where subcontracting starts to look less like a stopgap and more like how{" "}
        <Link href="/resources/how-fractional-executives-scale" className="text-burnt-600 underline hover:text-burnt-700">
          fractional executives actually scale their practice
        </Link>{" "}
        past the ceiling of their own hours. The operators who do this well aren&rsquo;t the ones who found flawless
        subcontractors on the first try. They&rsquo;re the ones who built a system — vetting, onboarding,
        visibility, and review — solid enough that the person doing the work matters less than it would otherwise,
        because the process catches what individual trust can&rsquo;t.
      </ArticleP>
      <ArticleP>
        Subcontracting is a quality-control problem wearing a hiring problem&rsquo;s clothes. Treat the vetting,
        onboarding, and oversight with the same rigor you&rsquo;d give a client engagement, and the client never has
        a reason to know — or care — how many hands actually touched the work.
      </ArticleP>
    </ArticleLayout>
  );
}
