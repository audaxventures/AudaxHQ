// Platform admin queries — the one deliberate exception to this app's
// tenant-isolation rule (every other data-layer function scopes its query
// by business_id; these intentionally query across every business on the
// platform). Every export here must only ever be called from behind
// requirePlatformAdmin() (see src/lib/currentUser.ts) — never expose these
// to a normal OWNER/TEAM_MEMBER request path.

import { sql } from "@/lib/db";
import type { Feedback, FeedbackStatus, SessionRole } from "@/lib/types";

export interface PlatformStats {
  totalWorkspaces: number;
  activeWorkspaces: number;
  suspendedWorkspaces: number;
  /** Every owner + team member with a login, platform-wide — account_emails is already the global "who can sign in" index. */
  totalUsers: number;
  newSignups30d: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const [workspaceRows, userRows] = await Promise.all([
    sql`
      select
        count(*)::int as total,
        count(*) filter (where suspended_at is null)::int as active,
        count(*) filter (where suspended_at is not null)::int as suspended,
        count(*) filter (where created_at >= now() - interval '30 days')::int as new_30d
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
    newSignups30d: w.new_30d as number,
  };
}

export interface GrowthPoint {
  month: string;
  label: string;
  workspaces: number;
  users: number;
}

/**
 * Cumulative workspace + user counts by month, for the growth chart. There's
 * no "login granted at" timestamp on account_emails, so "users" is
 * approximated as one event per business (the owner) plus one event per
 * team member row that has a login — close enough for a trend line, not
 * meant to be an audit-grade count.
 */
export async function getGrowthSeries(): Promise<GrowthPoint[]> {
  const [workspaceRows, userRows] = await Promise.all([
    sql`
      select date_trunc('month', created_at)::date as month, count(*)::int as n
      from businesses
      group by 1
    `,
    sql`
      select date_trunc('month', created_at)::date as month, count(*)::int as n
      from (
        select created_at from businesses
        union all
        select created_at from team_members where passcode_hash is not null
      ) events
      group by 1
    `,
  ]);
  if (workspaceRows.length === 0) return [];

  // Neon returns a `date`-typed column as a JS Date object at runtime (not a
  // string, despite the ::date cast), so every key must be normalized before
  // use as a Map key or it'll never match the string keys built below.
  const monthKey = (value: unknown) => new Date(value as string | Date).toISOString().slice(0, 10);

  const workspacesByMonth = new Map<string, number>();
  for (const r of workspaceRows as Record<string, unknown>[]) {
    workspacesByMonth.set(monthKey(r.month), r.n as number);
  }
  const usersByMonth = new Map<string, number>();
  for (const r of userRows as Record<string, unknown>[]) {
    usersByMonth.set(monthKey(r.month), r.n as number);
  }

  const months = [...workspacesByMonth.keys()].sort();
  const start = new Date(months[0]);
  const end = new Date();
  end.setDate(1);

  const points: GrowthPoint[] = [];
  let cumulativeWorkspaces = 0;
  let cumulativeUsers = 0;
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    cumulativeWorkspaces += workspacesByMonth.get(key) ?? 0;
    cumulativeUsers += usersByMonth.get(key) ?? 0;
    points.push({
      month: key,
      label: cursor.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      workspaces: cumulativeWorkspaces,
      users: cumulativeUsers,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return points;
}

export interface PlatformActivityCounts {
  clients: number;
  leads: number;
  tasks: number;
  followUps: number;
  meetingNotes: number;
}

/** Platform-wide content volume, for the admin dashboard's quick-metrics card. */
export async function getPlatformActivityCounts(): Promise<PlatformActivityCounts> {
  const rows = await sql`
    select
      (select count(*) from clients)::int as clients,
      (select count(*) from leads)::int as leads,
      (select count(*) from todos)::int as tasks,
      (select count(*) from follow_ups)::int as follow_ups,
      (select count(*) from meeting_notes)::int as meeting_notes
  `;
  const r = rows[0] as Record<string, unknown>;
  return {
    clients: r.clients as number,
    leads: r.leads as number,
    tasks: r.tasks as number,
    followUps: r.follow_ups as number,
    meetingNotes: r.meeting_notes as number,
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

export interface AdminWorkspaceDetail extends AdminWorkspaceSummary {
  leadCount: number;
  taskCount: number;
  followUpCount: number;
  meetingNoteCount: number;
}

/** Full stats for a single workspace, for the admin workspace detail page. Returns null if the id doesn't exist. */
export async function getWorkspaceDetail(businessId: string): Promise<AdminWorkspaceDetail | null> {
  const rows = await sql`
    select
      b.id, b.name, b.owner_name, b.owner_email, b.created_at, b.suspended_at,
      coalesce(tm.n, 0) as team_member_count,
      coalesce(c.n, 0) as client_count,
      coalesce(l.n, 0) as lead_count,
      coalesce(t.n, 0) as task_count,
      coalesce(f.n, 0) as follow_up_count,
      coalesce(m.n, 0) as meeting_note_count
    from businesses b
    left join (select business_id, count(*) as n from team_members group by business_id) tm on tm.business_id = b.id
    left join (select business_id, count(*) as n from clients group by business_id) c on c.business_id = b.id
    left join (select business_id, count(*) as n from leads group by business_id) l on l.business_id = b.id
    left join (select business_id, count(*) as n from todos group by business_id) t on t.business_id = b.id
    left join (select business_id, count(*) as n from follow_ups group by business_id) f on f.business_id = b.id
    left join (select business_id, count(*) as n from meeting_notes group by business_id) m on m.business_id = b.id
    where b.id = ${businessId}
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    ...mapWorkspaceSummary(row),
    leadCount: Number(row.lead_count),
    taskCount: Number(row.task_count),
    followUpCount: Number(row.follow_up_count),
    meetingNoteCount: Number(row.meeting_note_count),
  };
}

export interface AdminFeedbackItem extends Feedback {
  businessName: string;
}

function mapFeedbackItem(row: Record<string, unknown>): AdminFeedbackItem {
  return {
    id: row.id as string,
    businessId: row.business_id as string,
    businessName: row.business_name as string,
    submittedByName: row.submitted_by_name as string,
    submittedByRole: row.submitted_by_role as SessionRole,
    message: row.message as string,
    status: row.status as FeedbackStatus,
    createdAt: row.created_at as string,
  };
}

/** Every feedback submission across every workspace, newest first. */
export async function listAllFeedback(): Promise<AdminFeedbackItem[]> {
  const rows = await sql`
    select f.*, b.name as business_name
    from feedback f
    join businesses b on b.id = f.business_id
    order by f.created_at desc
  `;
  return rows.map((r) => mapFeedbackItem(r as Record<string, unknown>));
}

export async function setFeedbackStatus(feedbackId: string, status: FeedbackStatus): Promise<void> {
  await sql`update feedback set status = ${status} where id = ${feedbackId}`;
}

export async function suspendBusiness(businessId: string): Promise<void> {
  await sql`update businesses set suspended_at = now(), updated_at = now() where id = ${businessId}`;
}

export async function reactivateBusiness(businessId: string): Promise<void> {
  await sql`update businesses set suspended_at = null, updated_at = now() where id = ${businessId}`;
}

/**
 * Irreversibly erases a workspace and everything in it — every other
 * business-scoped table cascades via `on delete cascade` (see migration
 * 018). Both guards (must be suspended, name must match exactly) are
 * enforced right in the query so the check and the delete can't race apart;
 * zero rows back means the caller's confirmation didn't hold.
 */
export async function deleteBusiness(businessId: string, expectedName: string): Promise<void> {
  const rows = await sql`
    delete from businesses
    where id = ${businessId} and suspended_at is not null and name = ${expectedName}
    returning id
  `;
  if (rows.length === 0) {
    throw new Error("Workspace must be suspended and the typed name must match exactly before it can be permanently deleted.");
  }
}
