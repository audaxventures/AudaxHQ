import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { getTeamMember } from "@/lib/data/teamMembers";
import { getClientAccessIds } from "@/lib/data/clientAccess";
import { getBusiness } from "@/lib/data/businesses";
import { clientBelongsToBusiness } from "@/lib/data/clients";
import { leadBelongsToBusiness } from "@/lib/data/leads";
import { partnerBelongsToBusiness } from "@/lib/data/partners";
import { prospectBelongsToBusiness } from "@/lib/data/prospects";
import type { CurrentUser } from "@/lib/types";

/** Resolves the signed session cookie into a full current-user record. Null if unauthenticated, the business has been suspended by a platform admin, or the team member's login was revoked since the cookie was issued. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const claims = verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!claims) return null;

  const business = await getBusiness(claims.businessId);
  if (business.suspendedAt) return null;
  if (claims.role === "OWNER") return { role: "OWNER", businessId: claims.businessId, business };

  const teamMember = await getTeamMember(claims.teamMemberId!, claims.businessId);
  if (!teamMember || !teamMember.active || !teamMember.hasLogin) return null;
  return { role: "TEAM_MEMBER", businessId: claims.businessId, business, teamMember };
}

/**
 * Mirrors the billing gate in (app)/layout.tsx — null (Checkout never
 * completed) or canceled means no active Stripe subscription. Every other
 * status (trialing, active, even past_due mid-retry) keeps full access,
 * matching Stripe's own payment-retry grace period. Exported so the layout
 * and every require*() guard below share one definition instead of two
 * that could drift apart.
 */
export function isBillingBlocked(status: string | null): boolean {
  return status === null || status === "canceled";
}

const BILLING_BLOCKED_MESSAGE = "Your workspace's subscription isn't active — visit Settings → Billing to continue.";

/** Same as requireCurrentUser() but does NOT enforce the billing gate. The only legitimate caller is the Settings > Billing page itself (settings/billing/page.tsx) — it must keep rendering (for both owner and team member) precisely when billing is blocked, since that's the one page the layout's gate lets a blocked workspace reach at all. Every other caller should use requireCurrentUser(). */
export async function requireCurrentUserIgnoringBilling(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authorized.");
  return user;
}

/** Resolves the current user, throwing if unauthenticated — proxy.ts already guarantees a valid session reaches every (app) page, so this should only fire in the same rare revoked-mid-session edge case getCurrentUser() itself documents. Also throws if the workspace's billing is blocked (see isBillingBlocked) — this is what actually stops a team member or owner from using any data-mutating action while a subscription never started or was canceled, since the layout's redirect only ever covers full page navigations, not server actions invoked directly from already-rendered UI. Use on pages/actions that need businessId unconditionally rather than degrading gracefully. */
export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await requireCurrentUserIgnoringBilling();
  if (isBillingBlocked(user.business.subscriptionStatus)) throw new Error(BILLING_BLOCKED_MESSAGE);
  return user;
}

/** Same as requireOwner() but does NOT enforce the billing gate. The only legitimate callers are startSubscriptionCheckout/openBillingPortal (settings/actions.ts) — they must keep working precisely when billing is blocked, since that's the owner's only way to fix it. Every other caller should use requireOwner(). */
export async function requireOwnerIgnoringBilling(): Promise<CurrentUser & { role: "OWNER" }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    throw new Error("Not authorized.");
  }
  return user;
}

/** Throws if the current session isn't the owner, or if the workspace's billing is blocked (see isBillingBlocked on requireCurrentUser) — use at the top of server actions that must never run for a team member, even if they call the action endpoint directly. Returns the resolved user so callers can read businessId without a second lookup. */
export async function requireOwner(): Promise<CurrentUser & { role: "OWNER" }> {
  const user = await requireOwnerIgnoringBilling();
  if (isBillingBlocked(user.business.subscriptionStatus)) throw new Error(BILLING_BLOCKED_MESSAGE);
  return user;
}

/** First name of whoever's signed in — owner or team member — for use in prefilled outbound copy like the meeting-note email drawer's sign-off. */
export function senderFirstName(user: CurrentUser): string {
  const fullName = user.role === "OWNER" ? user.business.ownerName : user.teamMember.name;
  return fullName.trim().split(/\s+/)[0] || fullName;
}

/** Emails allowed onto the platform admin portal — comma-separated PLATFORM_ADMIN_EMAILS env var, unset means nobody has access. */
function platformAdminEmails(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** True for an OWNER whose business email is allowlisted as a platform admin — an axis orthogonal to OWNER/TEAM_MEMBER, since it's about operating the SaaS platform itself, not any one workspace. */
export function isPlatformAdmin(user: CurrentUser): boolean {
  return user.role === "OWNER" && platformAdminEmails().includes(user.business.ownerEmail.toLowerCase());
}

/** Throws unless the current session is a platform admin — use at the top of every /admin page and server action. Returns the resolved user so callers can read businessId without a second lookup. */
export async function requirePlatformAdmin(): Promise<CurrentUser & { role: "OWNER" }> {
  const user = await requireOwner();
  if (!isPlatformAdmin(user)) throw new Error("Not authorized.");
  return user;
}

/**
 * Throws unless the current session belongs to the client's own business
 * AND (for a team member) has that client in their access list — defense
 * in depth against a direct server-action call bypassing the UI's
 * already-filtered client list, and the tenant-isolation boundary that
 * stops one business's session from touching another business's client
 * by id. Owners still pass the access-list check automatically, but not
 * the business-ownership one. Returns the resolved user so callers can
 * branch on role without a second lookup.
 */
export async function requireClientAccess(clientId: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authorized.");
  if (isBillingBlocked(user.business.subscriptionStatus)) throw new Error(BILLING_BLOCKED_MESSAGE);
  if (!(await clientBelongsToBusiness(clientId, user.businessId))) {
    throw new Error("You don't have access to that client.");
  }
  if (user.role === "OWNER") return user;
  const ids = await getClientAccessIds(user.teamMember.id, user.businessId);
  if (!ids.includes(clientId)) throw new Error("You don't have access to that client.");
  return user;
}

/** Throws unless the current session's business owns this lead — leads have no per-team-member access-list concept, so this is purely the tenant-isolation boundary. Returns the resolved user so callers can read businessId without a second lookup. */
export async function requireLeadAccess(leadId: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authorized.");
  if (isBillingBlocked(user.business.subscriptionStatus)) throw new Error(BILLING_BLOCKED_MESSAGE);
  if (!(await leadBelongsToBusiness(leadId, user.businessId))) {
    throw new Error("You don't have access to that lead.");
  }
  return user;
}

/** Throws unless the current session is the owner of the partner's business — partners are an owner-only feature (referral/commission data), like Invoices. Returns the resolved user so callers can read businessId without a second lookup. */
export async function requirePartnerAccess(partnerId: string): Promise<CurrentUser & { role: "OWNER" }> {
  const user = await requireOwner();
  if (!(await partnerBelongsToBusiness(partnerId, user.businessId))) {
    throw new Error("You don't have access to that partner.");
  }
  return user;
}

/** Throws unless the current session's business owns this prospect — like leads, prospects have no per-team-member access-list concept (unrestricted for every team member), so this is purely the tenant-isolation boundary. Returns the resolved user so callers can read businessId without a second lookup. */
export async function requireProspectAccess(prospectId: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authorized.");
  if (isBillingBlocked(user.business.subscriptionStatus)) throw new Error(BILLING_BLOCKED_MESSAGE);
  if (!(await prospectBelongsToBusiness(prospectId, user.businessId))) {
    throw new Error("You don't have access to that prospect.");
  }
  return user;
}
