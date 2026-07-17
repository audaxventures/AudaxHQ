import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Section } from "@/components/site/Section";
import { appPath } from "@/lib/site";

// Mirrors src/app/site/layout.tsx's marketingHost derivation — needed here
// too since each article's JSON-LD needs an absolute canonical URL.
const marketingHost = (process.env.MARKETING_HOSTS ?? "www.verclara.io,verclara.io").split(",")[0].trim();

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function ArticleLayout({
  slug,
  title,
  description,
  category,
  publishedAt,
  readingMinutes,
  children,
}: {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  readingMinutes: number;
  children: React.ReactNode;
}) {
  const url = `https://${marketingHost}/resources/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished: publishedAt,
    dateModified: publishedAt,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: `https://${marketingHost}/og-dashboard-thumb.png`,
    author: { "@type": "Organization", name: "Verclara", url: `https://${marketingHost}` },
    publisher: {
      "@type": "Organization",
      name: "Verclara",
      logo: { "@type": "ImageObject", url: `https://${marketingHost}/hqlogo.png` },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="bg-cream-50">
        <Section className="pb-0 pt-14 sm:pt-16">
          <Link
            href="/resources"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 transition-colors hover:text-navy-800"
          >
            <ArrowLeft size={14} /> Back to Resources
          </Link>
          <div className="mt-6 max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-burnt-300 bg-burnt-100 px-3.5 py-1.5 text-xs font-medium text-burnt-700">
              {category}
            </span>
            <h1 className="mt-5 font-heading text-3xl font-semibold leading-[1.15] text-navy-900 sm:text-4xl">{title}</h1>
            <p className="mt-4 text-lg leading-relaxed text-navy-600">{description}</p>
            <p className="mt-4 text-sm text-navy-400">
              {formatDate(publishedAt)} &middot; {readingMinutes} min read
            </p>
          </div>
        </Section>
      </div>

      <div className="bg-cream-50">
        <Section className="pb-20 pt-10 sm:pb-24">
          <div className="mx-auto max-w-3xl">
            {children}

            <div className="mt-14 rounded-2xl border border-navy-100 bg-white p-8 text-center sm:p-10">
              <h2 className="font-heading text-2xl font-semibold text-navy-900">Run this from one workspace.</h2>
              <p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-navy-600">
                Verclara brings clients, pipeline, revenue, meetings, time, and tasks together — free during early
                access.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={appPath("/signup")}
                  className="inline-flex items-center gap-2 rounded-xl bg-burnt-500 px-5 py-3 text-sm font-semibold text-cream-50 shadow-sm transition-colors hover:bg-burnt-400"
                >
                  Start for free <ArrowRight size={16} />
                </Link>
                <Link
                  href="/resources"
                  className="inline-flex items-center gap-2 rounded-xl border border-navy-200 px-5 py-3 text-sm font-semibold text-navy-800 transition-colors hover:border-navy-400 hover:bg-navy-100/50"
                >
                  More resources
                </Link>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </>
  );
}

export function ArticleH2({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 mt-10 font-heading text-2xl font-semibold text-navy-900">{children}</h2>;
}

export function ArticleP({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-base leading-relaxed text-navy-600">{children}</p>;
}

export function ArticleUL({ children }: { children: React.ReactNode }) {
  return <ul className="mb-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-navy-600">{children}</ul>;
}
