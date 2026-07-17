import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/site/Section";
import { RESOURCE_POSTS } from "@/lib/resources";

const TITLE = "Resources — Verclara";
const DESCRIPTION =
  "Practical guides on running a service business — client management, pipeline, profitability, time tracking, and more.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function ResourcesIndexPage() {
  return (
    <>
      <div className="bg-navy-900">
        <Section className="py-20 text-center lg:py-24">
          <span className="inline-flex items-center rounded-full border border-navy-700 bg-navy-800 px-3.5 py-1.5 text-xs font-medium text-navy-200">
            Resources
          </span>
          <h1 className="mx-auto mt-5 max-w-2xl font-heading text-4xl font-semibold leading-[1.1] text-cream-50 sm:text-5xl">
            Practical guides for running a service business.
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-navy-300">
            No fluff — straightforward guides on clients, pipeline, profitability, time tracking, and the operational
            details that actually move a service business forward.
          </p>
        </Section>
      </div>

      <div className="bg-cream-50">
        <Section>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {RESOURCE_POSTS.map((post) => (
              <Link
                key={post.slug}
                href={`/resources/${post.slug}`}
                className="group flex flex-col rounded-2xl border border-navy-100 bg-white p-6 transition-colors hover:border-burnt-300"
              >
                <span className="inline-flex w-fit items-center rounded-full bg-burnt-100 px-2.5 py-0.5 text-[11px] font-semibold text-burnt-600">
                  {post.category}
                </span>
                <h2 className="mt-3 font-heading text-lg font-semibold leading-snug text-navy-900 group-hover:text-burnt-600">
                  {post.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-navy-500">{post.description}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-navy-400">
                  <span>
                    {formatDate(post.publishedAt)} &middot; {post.readingMinutes} min read
                  </span>
                  <ArrowRight size={14} className="text-navy-300 transition-colors group-hover:text-burnt-500" />
                </div>
              </Link>
            ))}
          </div>
        </Section>
      </div>
    </>
  );
}
