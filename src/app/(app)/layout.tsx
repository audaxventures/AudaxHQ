import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Sidebar } from "@/components/nav/Sidebar";
import { MobileTopBar, MobileTabBar } from "@/components/nav/MobileNav";
import { QuickActionsFab } from "@/components/nav/QuickActionsFab";
import { NotificationBell } from "@/components/nav/NotificationBell";
import { PageTransition } from "@/components/PageTransition";
import { Footer } from "@/components/ui/Footer";
import { WelcomeModal } from "@/components/WelcomeModal";
import { getCurrentUser, isPlatformAdmin } from "@/lib/currentUser";
import { getNotificationSnapshot } from "@/lib/data/notifications";
import { accessibleClientIdsFor } from "@/lib/data/clientAccess";
import { getBusinessToday } from "@/lib/data/businesses";
import { selfId } from "@/lib/assign";

// A workspace that never finished Checkout (subscriptionStatus null) or whose
// subscription was fully canceled has no active Stripe subscription — every
// other status (trialing, active, even past_due mid-retry) keeps full access,
// matching how Stripe's own Smart Retries give a payment grace period before
// a subscription actually moves to canceled.
const BILLING_GATE_PATH = "/settings/billing";
function isBillingBlocked(status: string | null): boolean {
  return status === null || status === "canceled";
}

// This app is a live daily-use tool backed by Postgres — every page here
// needs fresh data on every request, so opt the whole section out of static
// prerendering rather than annotating each page individually.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUser();
  const billingBlocked = currentUser ? isBillingBlocked(currentUser.business.subscriptionStatus) : false;

  if (billingBlocked) {
    const pathname = (await headers()).get("x-pathname") ?? "";
    if (pathname !== BILLING_GATE_PATH) redirect(BILLING_GATE_PATH);

    // Reachable only on the billing page itself. Render a minimal shell with
    // no Sidebar, QuickActionsFab, or NotificationBell — those are chrome a
    // blocked workspace has no business seeing or using, and every action
    // they could trigger from here is blocked again server-side anyway (see
    // requireOwner()/requireCurrentUser() in currentUser.ts), but showing
    // the full app around a "pick a plan" screen reads as "you already have
    // access", which is exactly the wrong signal to send.
    return (
      <div className="flex min-h-dvh flex-col items-center bg-cream-50">
        <div className="w-full max-w-3xl px-4 py-10 sm:px-8">
          <div className="mb-8 flex items-center justify-between">
            <span className="w-16" aria-hidden />
            {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded or default logo, dimensions unknown */}
            <img src={currentUser?.business.logoUrl ?? "/logo.png"} alt="Verclara" className="h-10 w-auto" />
            <form action="/api/logout" method="post" className="w-16 text-right">
              <button type="submit" className="text-sm font-medium text-navy-500 hover:text-navy-800 cursor-pointer">
                Sign out
              </button>
            </form>
          </div>
          <PageTransition>{children}</PageTransition>
          <Footer />
        </div>
      </div>
    );
  }

  // proxy.ts already guarantees a valid session reaches this layout — a null
  // user here only means the team member's login was revoked mid-session,
  // so fail closed to the more restrictive role rather than crashing.
  const role = currentUser?.role ?? "TEAM_MEMBER";
  const logoUrl = currentUser?.business.logoUrl ?? null;
  const businessName = currentUser?.business.name ?? "Verclara";
  const isAdmin = currentUser ? isPlatformAdmin(currentUser) : false;

  const showWelcome = currentUser?.role === "OWNER" && !currentUser.business.onboardingDismissedAt;

  const notificationSnapshot = currentUser
    ? await (async () => {
        const [today, accessibleClientIds] = await Promise.all([
          getBusinessToday(currentUser.businessId),
          accessibleClientIdsFor(currentUser),
        ]);
        return getNotificationSnapshot(currentUser.businessId, selfId(currentUser), today, accessibleClientIds);
      })()
    : null;

  return (
    <div className="flex min-h-dvh w-full">
      {showWelcome && (
        <WelcomeModal ownerName={currentUser.business.ownerName} businessName={currentUser.business.name} />
      )}
      <Sidebar role={role} isAdmin={isAdmin} businessName={businessName} />
      <div className="flex flex-1 flex-col min-w-0">
        <MobileTopBar role={role} isAdmin={isAdmin} businessName={businessName} />
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-10 pb-24 md:pb-10 max-w-6xl w-full mx-auto">
          <div className="mb-4 flex items-center justify-between">
            {notificationSnapshot ? (
              <NotificationBell
                initialUnread={notificationSnapshot.unread}
                initialUnreadCount={notificationSnapshot.unreadCount}
                rightNow={notificationSnapshot.rightNow}
              />
            ) : (
              <span />
            )}
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
