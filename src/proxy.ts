import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

// Route prefixes that hold owner-only data (client billing, workspace
// settings) — team members are bounced back to / even if they navigate here
// directly. This is a defense on top of hiding the nav links, not a
// replacement for the requireOwner() checks in the server actions themselves.
const OWNER_ONLY_PATH_PREFIXES = ["/invoices", "/settings", "/api/export", "/api/invoice-aging/export", "/api/reports"];

// Passcode + team-member login gate for this internal tool. See /login and
// src/lib/auth.ts.
export function proxy(request: NextRequest) {
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

  return NextResponse.next();
}

export const config = {
  // logo.png, logo.white.png, and favicon.png must stay excluded: they're
  // requested by the login page itself, before the visitor has a valid
  // session cookie. favicon.ico stays excluded too since some browsers
  // probe for it regardless of the declared <link rel="icon">.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon.png|logo.png|logo.white.png|login).*)"],
};
