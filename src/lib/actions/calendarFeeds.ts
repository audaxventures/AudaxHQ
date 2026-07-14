"use server";

import { revalidatePath } from "next/cache";
import * as calendarFeeds from "@/lib/data/calendarFeeds";
import { requireCurrentUser } from "@/lib/currentUser";

/** null = the current user is the business owner, connecting their own (not a team member's) calendar. */
async function currentIdentity() {
  const user = await requireCurrentUser();
  const teamMemberId = user.role === "TEAM_MEMBER" ? user.teamMember.id : null;
  return { businessId: user.businessId, teamMemberId, timezone: user.business.timezone };
}

export async function addMyCalendarFeed(formData: FormData) {
  const { businessId, teamMemberId, timezone } = await currentIdentity();
  const feedUrl = String(formData.get("feedUrl") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim() || "Calendar";
  if (!feedUrl) return;

  const feed = await calendarFeeds.createCalendarFeed(businessId, { teamMemberId, label, feedUrl });
  await calendarFeeds.syncCalendarFeed(feed.id, businessId, feed.feedUrl, timezone);
  revalidatePath("/calendar");
}

export async function removeMyCalendarFeed(id: string) {
  const { businessId, teamMemberId } = await currentIdentity();
  const feed = await calendarFeeds.getCalendarFeed(id, businessId);
  if (!feed || feed.teamMemberId !== teamMemberId) return;
  await calendarFeeds.deleteCalendarFeed(id, businessId);
  revalidatePath("/calendar");
}

export async function syncMyCalendarFeedNow(id: string) {
  const { businessId, teamMemberId, timezone } = await currentIdentity();
  const feed = await calendarFeeds.getCalendarFeed(id, businessId);
  if (!feed || feed.teamMemberId !== teamMemberId) return;
  await calendarFeeds.syncCalendarFeed(id, businessId, feed.feedUrl, timezone);
  revalidatePath("/calendar");
}
