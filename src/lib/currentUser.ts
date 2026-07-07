import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { getTeamMember } from "@/lib/data/teamMembers";
import { getClientAccessIds } from "@/lib/data/clientAccess";
import { getBusiness } from "@/lib/data/businesses";
import type { CurrentUser } from "@/lib/types";

/** Resolves the signed session cookie into a full current-user record. Null if unauthenticated or the team member's login was revoked since the cookie was issued. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const claims = verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!claims) return null;

  const business = await getBusiness(claims.businessId);
  if (claims.role === "OWNER") return { role: "OWNER", businessId: claims.businessId, business };

  const teamMember = await getTeamMember(claims.teamMemberId!);
  if (!teamMember || !teamMember.active || !teamMember.hasLogin) return null;
  return { role: "TEAM_MEMBER", businessId: claims.businessId, business, teamMember };
}

/** Resolves the current user, throwing if unauthenticated — proxy.ts already guarantees a valid session reaches every (app) page, so this should only fire in the same rare revoked-mid-session edge case getCurrentUser() itself documents. Use on pages that need businessId unconditionally rather than degrading gracefully. */
export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authorized.");
  return user;
}

/** Throws if the current session isn't the owner — use at the top of server actions that must never run for a team member, even if they call the action endpoint directly. Returns the resolved user so callers can read businessId without a second lookup. */
export async function requireOwner(): Promise<CurrentUser & { role: "OWNER" }> {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    throw new Error("Not authorized.");
  }
  return user;
}

/** Throws if the current session is a team member without access to this client — defense in depth against a direct server-action call bypassing the UI's already-filtered client list. Owners always pass. Returns the resolved user so callers can branch on role without a second lookup. */
export async function requireClientAccess(clientId: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authorized.");
  if (user.role === "OWNER") return user;
  const ids = await getClientAccessIds(user.teamMember.id);
  if (!ids.includes(clientId)) throw new Error("You don't have access to that client.");
  return user;
}
