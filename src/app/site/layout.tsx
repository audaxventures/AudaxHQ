import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MarketingNav } from "@/components/site/MarketingNav";
import { MarketingFooter } from "@/components/site/MarketingFooter";

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
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
