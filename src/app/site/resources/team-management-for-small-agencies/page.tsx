import type { Metadata } from "next";
import { ArticleLayout, ArticleH2, ArticleP, ArticleUL } from "@/components/site/ArticleLayout";

const SLUG = "team-management-for-small-agencies";
const DISPLAY_TITLE = "How to Manage a Small Team Without Enterprise Software Overhead";
const TITLE = `${DISPLAY_TITLE} — Verclara`;
const DESCRIPTION =
  "Enterprise project management tools are built for a different problem. Here's what small agency teams actually need.";
const CATEGORY = "Team Management";
const PUBLISHED_AT = "2026-06-25";
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
    >
      <ArticleP>
        A five-person agency and a five-hundred-person enterprise are not the same shape of organization, but they&rsquo;re
        often sold the same software. Enterprise project management tools are built to coordinate across departments,
        approval chains, and reporting hierarchies. A small agency team doesn&rsquo;t have any of that — what it has
        is a handful of people who all need to know, at a glance, who owns what and which client needs attention
        today.
      </ArticleP>

      <ArticleH2>The real problem small teams have</ArticleH2>
      <ArticleP>
        It&rsquo;s rarely a lack of task-tracking. Most small teams can manage a to-do list just fine. The actual gap
        is visibility into <em>who else</em> is working on <em>which client</em>, without a manager having to ask.
        Who&rsquo;s handling the follow-up with Client A this week? Did anyone respond to Client B&rsquo;s last
        email? Is anyone overloaded while someone else has capacity? Enterprise tools answer this with dashboards
        built for department heads. A five-person team just needs it to be obvious.
      </ArticleP>

      <ArticleH2>What actually matters for a small service team</ArticleH2>
      <ArticleUL>
        <li>
          <strong>Per-client visibility, not just per-task.</strong> Knowing what&rsquo;s assigned to whom on a given
          client matters more than a generic project board.
        </li>
        <li>
          <strong>Control over who sees what.</strong> Not every team member needs visibility into every client&rsquo;s
          billing or every internal note — especially as a team grows past two or three people.
        </li>
        <li>
          <strong>A shared view of what&rsquo;s assigned to me versus assigned to others,</strong> so nobody has to
          ask &ldquo;wait, is someone already on this?&rdquo;
        </li>
        <li>
          <strong>Low setup cost.</strong> A tool that takes a week of configuration before a small team can use it
          is solving the wrong problem.
        </li>
      </ArticleUL>

      <ArticleH2>Why over-tooling backfires</ArticleH2>
      <ArticleP>
        The instinct when a team starts to feel disorganized is often to add more software — a project management
        tool here, a shared drive structure there, a separate CRM for leads. Each addition solves a narrow problem
        and creates a new one: another login, another place information can go stale, another tool that only half
        the team actually opens. Small teams are usually better served by fewer, more connected tools than by more,
        more specialized ones.
      </ArticleP>

      <ArticleH2>Building this without enterprise overhead</ArticleH2>
      <ArticleP>
        The goal for a small agency isn&rsquo;t less structure — it&rsquo;s structure that doesn&rsquo;t require a
        dedicated operations person to maintain. Verclara&rsquo;s team member access lets you add teammates and
        control exactly which clients each person can see and work on, with tasks that can be assigned and handed
        off across the team — all inside the same workspace everyone&rsquo;s already using for clients and pipeline,
        instead of a separate system to manage on top of it.
      </ArticleP>
    </ArticleLayout>
  );
}
