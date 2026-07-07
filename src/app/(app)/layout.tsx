import Link from "next/link";
import { Sidebar } from "@/components/nav/Sidebar";
import { MobileTopBar, MobileTabBar } from "@/components/nav/MobileNav";
import { QuickActionsFab } from "@/components/nav/QuickActionsFab";
import { PageTransition } from "@/components/PageTransition";
import { Footer } from "@/components/ui/Footer";
import { getCurrentUser } from "@/lib/currentUser";

// This app is a live daily-use tool backed by Postgres — every page here
// needs fresh data on every request, so opt the whole section out of static
// prerendering rather than annotating each page individually.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUser();
  // proxy.ts already guarantees a valid session reaches this layout — a null
  // user here only means the team member's login was revoked mid-session,
  // so fail closed to the more restrictive role rather than crashing.
  const role = currentUser?.role ?? "TEAM_MEMBER";
  const logoUrl = currentUser?.business.logoUrl ?? null;

  return (
    <div className="flex min-h-dvh w-full">
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col min-w-0">
        <MobileTopBar role={role} />
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-10 pb-24 md:pb-10 max-w-6xl w-full mx-auto">
          <div className="mb-4 flex justify-start md:justify-end">
            <Link href="/" className="transition-opacity hover:opacity-80">
              {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded or default logo, dimensions unknown */}
              <img src={logoUrl ?? "/logo.png"} alt="Audax Ventures" className="h-10 w-auto sm:h-16" />
            </Link>
          </div>
          <PageTransition>{children}</PageTransition>
          <Footer />
        </main>
        <MobileTabBar />
        <QuickActionsFab />
      </div>
    </div>
  );
}
