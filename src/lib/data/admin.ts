// Platform admin queries — the one deliberate exception to this app's
// tenant-isolation rule (every other data-layer function scopes its query
// by business_id; these intentionally query across every business on the
// platform). Every export here must only ever be called from behind
// requirePlatformAdmin() (see src/lib/currentUser.ts) — never expose these
// to a normal OWNER/TEAM_MEMBER request path.

import { sql } from "@/lib/db";

export interface PlatformStats {
  totalWorkspaces: number;
  activeWorkspaces: number;
  suspendedWorkspaces: number;
  /** Every owner + team member with a login, platform-wide — account_emails is already the global "who can sign in" index. */
  totalUsers: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const [workspaceRows, userRows] = await Promise.all([
    sql`
      select
        count(*)::int as total,
        count(*) filter (where suspended_at is null)::int as active,
        count(*) filter (where suspended_at is not null)::int as suspended
      from businesses
    `,
    sql`select count(*)::int as total from account_emails`,
  ]);
  const w = workspaceRows[0] as Record<string, unknown>;
  const u = userRows[0] as Record<string, unknown>;
  return {
    totalWorkspaces: w.total as number,
    activeWorkspaces: w.active as number,
    suspendedWorkspaces: w.suspended as number,
    totalUsers: u.total as number,
  };
}

export interface AdminWorkspaceSummary {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
  suspendedAt: string | null;
  teamMemberCount: number;
  clientCount: number;
}

function mapWorkspaceSummary(row: Record<string, unknown>): AdminWorkspaceSummary {
  return {
    id: row.id as string,
    name: row.name as string,
    ownerName: row.owner_name as string,
    ownerEmail: row.owner_email as string,
    createdAt: row.created_at as string,
    suspendedAt: row.suspended_at as string | null,
    teamMemberCount: Number(row.team_member_count),
    clientCount: Number(row.client_count),
  };
}

/** Every workspace on the platform, newest first. */
export async function listWorkspaces(): Promise<AdminWorkspaceSummary[]> {
  const rows = await sql`
    select
      b.id, b.name, b.owner_name, b.owner_email, b.created_at, b.suspended_at,
      coalesce(tm.team_member_count, 0) as team_member_count,
      coalesce(c.client_count, 0) as client_count
    from businesses b
    left join (
      select business_id, count(*) as team_member_count from team_members group by business_id
    ) tm on tm.business_id = b.id
    left join (
      select business_id, count(*) as client_count from clients group by business_id
    ) c on c.business_id = b.id
    order by b.created_at desc
  `;
  return rows.map((r) => mapWorkspaceSummary(r as Record<string, unknown>));
}

export async function suspendBusiness(businessId: string): Promise<void> {
  await sql`update businesses set suspended_at = now(), updated_at = now() where id = ${businessId}`;
}

export async function reactivateBusiness(businessId: string): Promise<void> {
  await sql`update businesses set suspended_at = null, updated_at = now() where id = ${businessId}`;
}
