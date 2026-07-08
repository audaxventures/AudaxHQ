import { sql } from "@/lib/db";

export interface AccountEmailLookup {
  businessId: string;
  role: "OWNER" | "TEAM_MEMBER";
  teamMemberId: string | null;
}

/**
 * The single source of truth for "which business does this email belong
 * to" — login only has an email + passcode to go on, no business selector,
 * so email must resolve globally and unambiguously across every business's
 * owner and every team member on the platform. Always normalize to
 * lower(trim(email)) before calling, matching how rows are written.
 */
export async function lookupAccountEmail(email: string): Promise<AccountEmailLookup | null> {
  const rows = await sql`select business_id, role, team_member_id from account_emails where email = ${email}`;
  const row = rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    businessId: row.business_id as string,
    role: row.role as "OWNER" | "TEAM_MEMBER",
    teamMemberId: row.team_member_id as string | null,
  };
}
