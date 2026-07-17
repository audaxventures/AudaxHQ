import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MarketingNav } from "@/components/site/MarketingNav";
import { MarketingFooter } from "@/components/site/MarketingFooter";

// The public hostname this marketing site is actually reached at (see
// proxy.ts's MARKETING_HOSTS rewrite) — needed so Next can resolve the
// og:image/twitter:image file-convention routes and canonical URLs to real
// absolute URLs instead of guessing from the request.
const marketingHost = (process.env.MARKETING_HOSTS ?? "www.verclara.io,verclara.io").split(",")[0].trim();

export const metadata: Metadata = {
  metadataBase: new URL(`https://${marketingHost}`),
  openGraph: {
    siteName: "Verclara",
    type: "website",
    locale: "en_CA",
  },
  twitter: {
    card: "summary_large_image",
  },
};

// SEO structured data — one Organization + one SoftwareApplication node,
// shared across every marketing page since neither varies by route.
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `https://${marketingHost}/#organization`,
      name: "Audax Ventures",
      url: `https://${marketingHost}`,
      logo: `https://${marketingHost}/hqlogo.png`,
      email: "info@audaxventures.ca",
    },
    {
      "@type": "SoftwareApplication",
      name: "Verclara",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "The business operating system for service businesses — clients, pipeline, revenue tracking, meetings, time, and tasks in one workspace.",
      url: `https://${marketingHost}`,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free during early access",
      },
    },
  ],
};

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // /site only exists to be reached via proxy.ts's marketing-host rewrite —
  // a direct hit on the app's own domain (no rewrite header set) bounces
  // back to the app instead of leaking the marketing site at a stray URL.
  const hdrs = await headers();
  if (hdrs.get("x-marketing-rewrite") !== "1") {
    redirect("/");
  }

  return (
    <div className="flex min-h-full flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
