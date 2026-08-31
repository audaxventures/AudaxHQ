import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as businesses from "@/lib/data/businesses";
import * as teamMembers from "@/lib/data/teamMembers";
import { sendDailyBriefToRecipient } from "@/lib/data/dailyBrief";
import { todayInTimezone } from "@/lib/timezone";

/**
 * Hit roughly hourly by an external scheduler (see
 * .github/workflows/daily-brief.yml — this app has no cron of its own, see
 * migration 032's header comment), not Vercel Cron: Vercel's free tier only
 * allows a once-daily invocation, which can't respect each business's own
 * timezone. Checking every business every hour and only acting on the ones
 * whose local time has reached their configured send hour gets per-timezone
 * delivery without needing a paid plan — see listBusinessesDueForDailyBrief
 * for the actual filter, including why it's "hour has passed" rather than
 * "hour matches exactly" (GitHub's schedule trigger skips hours outright
 * under load, not just slips by a few minutes).
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get("authorization");
  if (secret !== `Bearer ${process.env.DAILY_BRIEF_CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await businesses.listBusinessesDueForDailyBrief();
  let emailsSent = 0;

  for (const business of due) {
    try {
      const today = todayInTimezone(business.timezone);
      const recipients: { teamMemberId: string | null; email: string; name: string }[] = [];

      if (business.ownerNotifyDailyBrief && business.ownerEmail) {
        recipients.push({ teamMemberId: null, email: business.ownerEmail, name: business.ownerName });
      }
      for (const member of await teamMembers.listTeamMembers(business.id)) {
        if (member.notifyDailyBrief && member.email) {
          recipients.push({ teamMemberId: member.id, email: member.email, name: member.name });
        }
      }

      for (const recipient of recipients) {
        try {
          await sendDailyBriefToRecipient(business.id, today, recipient);
          emailsSent++;
        } catch (e) {
          console.error(`Failed to send daily brief to ${recipient.email}:`, e);
        }
      }

      // Marked even if every individual send above failed — a business
      // that's already had its attempt for today shouldn't be retried
      // again in an hour, since the next hourly run would just hit the
      // same failure. A hard-down Resend key needs a human to fix, not a
      // retry loop.
      await businesses.markDailyBriefSent(business.id);
    } catch (e) {
      console.error(`Failed to process daily brief for business ${business.id}:`, e);
    }
  }

  return NextResponse.json({ businessesProcessed: due.length, emailsSent });
}
