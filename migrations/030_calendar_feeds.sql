-- Audax HQ — one-way calendar feed import (phase 2 of the calendar
-- enhancement). Anyone with a login (owner or team member) can connect
-- their own existing calendar (Google/Outlook/Apple "secret address in
-- iCal format") from the Calendar page, so their busy time shows up
-- read-only, without any OAuth or two-way sync. Self-managed: only the
-- connecting person can see, sync, or remove their own feed.
--
-- team_member_id is nullable — null means the feed belongs to the
-- business owner (a business has exactly one, so that's unambiguous),
-- since the owner doesn't necessarily have a team_members row.
--
-- Not breaking, purely additive.
--
-- Run once: psql "$DATABASE_URL" -f migrations/030_calendar_feeds.sql

create table calendar_feeds (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  team_member_id uuid references team_members(id) on delete cascade,
  label text not null default 'Calendar',
  feed_url text not null,
  last_synced_at timestamptz,
  last_sync_error text,
  created_at timestamptz not null default now()
);

create index calendar_feeds_business_id_idx on calendar_feeds (business_id);
create index calendar_feeds_team_member_id_idx on calendar_feeds (team_member_id);

-- One row per imported occurrence — recurring events are expanded at sync
-- time into individual rows rather than stored as an RRULE, and this table
-- is replaced wholesale on every sync (no diffing/update-in-place).
create table calendar_feed_events (
  id uuid primary key default gen_random_uuid(),
  feed_id uuid not null references calendar_feeds(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  uid text not null,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz,
  all_day boolean not null default false,
  location text
);

create index calendar_feed_events_feed_id_idx on calendar_feed_events (feed_id);
create index calendar_feed_events_business_range_idx on calendar_feed_events (business_id, start_at);
