import Link from "next/link";
import { Sidebar } from "@/components/nav/Sidebar";
import { MobileTopBar, MobileTabBar } from "@/components/nav/MobileNav";
import { QuickActionsFab } from "@/components/nav/QuickActionsFab";
import { PageTransition } from "@/components/PageTransition";

// This app is a live daily-use tool backed by Postgres — every page here
// needs fresh data on every request, so opt the whole section out of static
// prerendering rather than annotating each page individually.
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <MobileTopBar />
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-10 pb-24 md:pb-10 max-w-6xl w-full mx-auto">
          <div className="mb-4 hidden justify-end md:flex">
            <Link href="/" className="transition-opacity hover:opacity-80">
              {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded logo, dimensions unknown */}
              <img src="/logo.png" alt="Audax Ventures" className="h-16 w-auto" />
            </Link>
          </div>
          <PageTransition>{children}</PageTransition>
        </main>
        <MobileTabBar />
        <QuickActionsFab />
      </div>
    </div>
  );
}
