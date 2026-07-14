"use server";

import { revalidatePath } from "next/cache";
import * as calendarFeeds from "@/lib/data/calendarFeeds";
import { requireOwner } from "@/lib/currentUser";

function revalidate() {
  revalidatePath("/settings/team-members");
  revalidatePath("/calendar");
}

export async function addCalendarFeed(teamMemberId: string, formData: FormData) {
  const user = await requireOwner();
  const feedUrl = String(formData.get("feedUrl") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim() || "Calendar";
  if (!feedUrl) return;

  const feed = await calendarFeeds.createCalendarFeed(user.businessId, { teamMemberId, label, feedUrl });
  await calendarFeeds.syncCalendarFeed(feed.id, user.businessId, feed.feedUrl, user.business.timezone);
  revalidate();
}

export async function removeCalendarFeed(id: string) {
  const user = await requireOwner();
  await calendarFeeds.deleteCalendarFeed(id, user.businessId);
  revalidate();
}

export async function syncCalendarFeedNow(id: string) {
  const user = await requireOwner();
  const feed = await calendarFeeds.getCalendarFeed(id, user.businessId);
  if (!feed) return;
  await calendarFeeds.syncCalendarFeed(id, user.businessId, feed.feedUrl, user.business.timezone);
  revalidate();
}
