import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

// Route prefixes that hold owner-only data (client billing, workspace
// settings) — team members are bounced back to / even if they navigate here
// directly. This is a defense on top of hiding the nav links, not a
// replacement for the requireOwner() checks in the server actions themselves.
const OWNER_ONLY_PATH_PREFIXES = ["/invoices", "/settings", "/admin", "/api/export", "/api/invoice-aging/export", "/api/reports"];

// Routes temporarily disabled for everyone, owner included — the feature is
// still fully built (page, data layer, migrations) but not ready to expose
// while its scope gets rethought. Remove a prefix here (and the matching
// nav-links.ts entry) to bring a feature back.
const HIDDEN_PATH_PREFIXES = ["/calendar"];

// Hostnames that serve the public marketing site (src/app/site/*) instead of
// the app. Requests here are rewritten to /site/* and never reach the
// passcode gate below — the marketing site has no session-gated content.
// Unset in local dev, so localhost always serves the app exactly as before.
const MARKETING_HOSTS = (process.env.MARKETING_HOSTS ?? "audaxhq.ca,www.audaxhq.ca")
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

  if (claims.role === "TEAM_MEMBER" && OWNER_ONLY_PATH_PREFIXES.some((p) => request.nextUrl.pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (HIDDEN_PATH_PREFIXES.some((p) => request.nextUrl.pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
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
  matcher: ["/((?!_next/static|_next/image|login|signup|.*\\..*).*)"],
};
