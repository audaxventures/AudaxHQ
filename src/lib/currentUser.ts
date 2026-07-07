import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { getTeamMember } from "@/lib/data/teamMembers";
import type { CurrentUser } from "@/lib/types";

/** Resolves the signed session cookie into a full current-user record. Null if unauthenticated or the team member's login was revoked since the cookie was issued. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const claims = verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!claims) return null;
  if (claims.role === "OWNER") return { role: "OWNER" };

  const teamMember = await getTeamMember(claims.teamMemberId!);
  if (!teamMember || !teamMember.active || !teamMember.hasLogin) return null;
  return { role: "TEAM_MEMBER", teamMember };
}

/** Throws if the current session isn't the owner — use at the top of server actions that must never run for a team member, even if they call the action endpoint directly. */
export async function requireOwner(): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "OWNER") {
    throw new Error("Not authorized.");
  }
}
