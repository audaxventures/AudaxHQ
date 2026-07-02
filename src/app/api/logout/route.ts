import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

// Plain Route Handler rather than a Server Action: this form renders on
// every page via the shared nav, and having it as a Server Action collided
// with other actions' ID resolution in this Next.js version.
export async function POST(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
