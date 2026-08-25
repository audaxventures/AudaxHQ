import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

// Route prefixes that hold owner-only data (client billing, workspace
// settings) — team members are bounced back to / even if they navigate here
// directly. This is a defense on top of hiding the nav links, not a
// replacement for the requireOwner() checks in the server actions themselves.
// /partners is deliberately NOT here — access is a per-team-member grant
// (team_members.has_partners_access, see migration 046), checked at the
// page/action level instead of this blanket route-prefix block, the same
// way per-client access is (proxy.ts has no /clients prefix either).
const OWNER_ONLY_PATH_PREFIXES = ["/invoices", "/settings", "/admin", "/api/export", "/api/invoice-aging/export", "/api/reports"];

// /settings is owner-only above, but every team member needs to be able to
// land on the billing page specifically — a lapsed subscription redirects
// the whole workspace there (see (app)/layout.tsx), owner or not, and the
// page itself renders a read-only view for anyone who isn't the owner.
// /settings/notifications and /settings/passcode are the same kind of
// exception, for a different reason: both are self-service (see migration
// 048, and changeTeamMemberPasscode in settings/actions.ts) — every user
// manages their own email notification preferences and password there, not
// just the owner's. Billing stays reachable for the redirect above even
// though SettingsSubNav no longer shows it as a tab for a team member —
// this list is about route access, not sidebar visibility.
const TEAM_MEMBER_ACCESSIBLE_EXCEPTIONS = ["/settings/billing", "/settings/notifications", "/settings/passcode"];

// Hostnames that serve the public marketing site (src/app/site/*) instead of
// the app. Requests here are rewritten to /site/* and never reach the
// passcode gate below — the marketing site has no session-gated content.
// Unset in local dev, so localhost always serves the app exactly as before.
const MARKETING_HOSTS = (process.env.MARKETING_HOSTS ?? "www.verclara.io,verclara.io")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

// Passcode + team-member login gate for this internal tool. See /login and
// src/lib/auth.ts.
export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  if (MARKETING_HOSTS.includes(host)) {
    const url = request.nextUrl.clone();
    url.pathname = `/site${url.pathname === "/" ? "" : url.pathname}`;
    // Signals to src/app/site/layout.tsx that this request legitimately came
    // through the marketing-host rewrite, so a direct /site/* hit on the app
    // domain (host not in MARKETING_HOSTS) doesn't fall through and render.
    const headers = new Headers(request.headers);
    headers.set("x-marketing-rewrite", "1");
    return NextResponse.rewrite(url, { request: { headers } });
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const claims = verifySessionToken(token);
  if (!claims) {
    const loginUrl = new URL("/login", request.url);
    if (request.nextUrl.pathname !== "/") {
      loginUrl.searchParams.set("next", request.nextUrl.pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (
    claims.role === "TEAM_MEMBER" &&
    !TEAM_MEMBER_ACCESSIBLE_EXCEPTIONS.includes(request.nextUrl.pathname) &&
    OWNER_ONLY_PATH_PREFIXES.some((p) => request.nextUrl.pathname.startsWith(p))
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // (app)/layout.tsx redirects a lapsed-billing workspace to /settings/billing
  // for every page, and needs to know when it's already rendering that page
  // to avoid redirecting to itself — Server Components have no built-in way
  // to read the current pathname, so pass it through as a request header.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Any static file under public/ (anything with a dot in its path — images,
  // favicon.ico, etc.) is excluded entirely: none of it is sensitive, some of
  // it is fetched with no session at all (the welcome email's header image,
  // the login page's own background before the visitor is authenticated),
  // and — since this proxy also does the marketing-host rewrite below — a
  // request for a plain file must never get rewritten to /site/<file>, which
  // doesn't exist and would 404. Enumerating filenames one at a time here
  // has bitten us before (sidebar.png/login.png 404ing on marketing hosts
  // because they weren't on the old list) — exclude the whole class instead.
  // api/webhooks and api/cron are excluded too — Stripe's webhook requests
  // and the hourly Daily Brief trigger (see api/cron/daily-brief/route.ts)
  // both carry no session cookie (they're server-to-server), so gating them
  // here would bounce every delivery to /login instead of reaching the
  // route handler. Both routes do their own auth (webhook signature / cron
  // shared secret) — this exclusion only skips the session gate, not
  // authorization entirely.
  matcher: ["/((?!_next/static|_next/image|login|signup|api/webhooks|api/cron|.*\\..*).*)"],
};
