import { sql } from "@/lib/db";
import type { CalendarFeed } from "@/lib/types";
import { fetchAndParseIcsFeed, type ParsedIcsEvent } from "@/lib/icsImport";

/** A connected feed is re-fetched at most this often, on-demand from whoever next opens the calendar — see syncStaleCalendarFeeds. */
const STALE_AFTER_MINUTES = 30;

function mapCalendarFeed(row: Record<string, unknown>): CalendarFeed {
  return {
    id: row.id as string,
    teamMemberId: row.team_member_id as string,
    teamMemberName: row.team_member_name as string,
    label: row.label as string,
    feedUrl: row.feed_url as string,
    lastSyncedAt: (row.last_synced_at as string | null) ?? null,
    lastSyncError: (row.last_sync_error as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function listCalendarFeeds(businessId: string): Promise<CalendarFeed[]> {
  const rows = await sql`
    select cf.*, tm.name as team_member_name
    from calendar_feeds cf
    join team_members tm on tm.id = cf.team_member_id
    where cf.business_id = ${businessId}
    order by tm.name asc, cf.created_at asc
  `;
  return rows.map((r) => mapCalendarFeed(r as Record<string, unknown>));
}

export interface CreateCalendarFeedInput {
  teamMemberId: string;
  label: string;
  feedUrl: string;
}

export async function createCalendarFeed(businessId: string, input: CreateCalendarFeedInput): Promise<CalendarFeed> {
  const rows = await sql`
    insert into calendar_feeds (business_id, team_member_id, label, feed_url)
    values (${businessId}, ${input.teamMemberId}, ${input.label}, ${input.feedUrl})
    returning *, (select name from team_members where id = ${input.teamMemberId}) as team_member_name
  `;
  return mapCalendarFeed(rows[0] as Record<string, unknown>);
}

export async function getCalendarFeed(id: string, businessId: string): Promise<CalendarFeed | null> {
  const rows = await sql`
    select cf.*, tm.name as team_member_name
    from calendar_feeds cf
    join team_members tm on tm.id = cf.team_member_id
    where cf.id = ${id} and cf.business_id = ${businessId}
  `;
  return rows[0] ? mapCalendarFeed(rows[0] as Record<string, unknown>) : null;
}

export async function deleteCalendarFeed(id: string, businessId: string): Promise<void> {
  await sql`delete from calendar_feeds where id = ${id} and business_id = ${businessId}`;
}

async function replaceFeedEvents(feedId: string, businessId: string, events: ParsedIcsEvent[]): Promise<void> {
  await sql.transaction([
    sql`delete from calendar_feed_events where feed_id = ${feedId}`,
    sql`
      insert into calendar_feed_events (feed_id, business_id, uid, title, start_at, end_at, all_day, location)
      select ${feedId}, ${businessId}, * from unnest(
        ${events.map((e) => e.uid)}::text[],
        ${events.map((e) => e.title)}::text[],
        ${events.map((e) => e.start.toISOString())}::timestamptz[],
        ${events.map((e) => (e.end ? e.end.toISOString() : null))}::timestamptz[],
        ${events.map((e) => e.allDay)}::boolean[],
        ${events.map((e) => e.location)}::text[]
      )
    `,
  ]);
}

/** Fetches + parses a single feed and replaces its materialized events, recording the sync result either way. */
export async function syncCalendarFeed(
  feedId: string,
  businessId: string,
  feedUrl: string,
  fallbackTimeZone: string
): Promise<void> {
  const result = await fetchAndParseIcsFeed(feedUrl, fallbackTimeZone);
  if ("error" in result) {
    await sql`update calendar_feeds set last_synced_at = now(), last_sync_error = ${result.error} where id = ${feedId}`;
    return;
  }
  await replaceFeedEvents(feedId, businessId, result.events);
  await sql`update calendar_feeds set last_synced_at = now(), last_sync_error = null where id = ${feedId}`;
}

/**
 * Best-effort, non-throwing refresh of every feed that hasn't synced recently — called from the
 * calendar page itself (same lazy-on-view pattern as recurring invoice creation; see README) so
 * there's no cron job to run. One slow or broken feed never blocks the others or the page render
 * beyond fetchAndParseIcsFeed's own timeout.
 */
export async function syncStaleCalendarFeeds(businessId: string, timezone: string): Promise<void> {
  const rows = await sql`
    select id, feed_url from calendar_feeds
    where business_id = ${businessId}
      and (last_synced_at is null or last_synced_at < now() - make_interval(mins => ${STALE_AFTER_MINUTES}))
  `;
  if (rows.length === 0) return;
  await Promise.allSettled(
    rows.map((r) => {
      const row = r as Record<string, unknown>;
      return syncCalendarFeed(row.id as string, businessId, row.feed_url as string, timezone);
    })
  );
}
