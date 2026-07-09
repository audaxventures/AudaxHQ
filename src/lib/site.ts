// Shared constants for the public marketing site (src/app/site/*).

/**
 * Origin of the app itself (login/signup/dashboard) — the marketing site's
 * "Sign in" / "Start for free" links point here. Defaults to a relative
 * same-origin path, which is exactly right for local dev (one Next.js
 * server, no domain split yet). Set NEXT_PUBLIC_APP_URL once the app
 * actually moves to its own subdomain in production (e.g. app.audaxhq.ca).
 */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

export function appPath(path: string): string {
  return `${APP_URL}${path}`;
}
