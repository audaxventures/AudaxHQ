import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, isValidSessionToken } from "@/lib/auth";

// Single shared-passcode gate for this internal tool — not a real auth
// system, just a lock on the front door. See /login and src/lib/auth.ts.
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (isValidSessionToken(token)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  if (request.nextUrl.pathname !== "/") {
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // logo.png, logo.white.png, and favicon.png must stay excluded: they're
  // requested by the login page itself, before the visitor has a valid
  // session cookie. favicon.ico stays excluded too since some browsers
  // probe for it regardless of the declared <link rel="icon">.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon.png|logo.png|logo.white.png|login).*)"],
};
