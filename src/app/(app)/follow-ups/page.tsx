import { CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FollowUpsWorkspace } from "@/components/followups/FollowUpsWorkspace";
import { listAllFollowUps } from "@/lib/data/followups";
import { listTeamMembers } from "@/lib/data/teamMembers";
import { getBusinessToday } from "@/lib/data/businesses";
import { accessibleClientIdsFor } from "@/lib/data/clientAccess";
import { requireCurrentUser } from "@/lib/currentUser";

export default async function FollowUpsPage() {
  const user = await requireCurrentUser();
  const accessibleClientIds = await accessibleClientIdsFor(user);
  const today = await getBusinessToday(user.businessId);
  const [followUps, teamMembers] = await Promise.all([
    listAllFollowUps(user.businessId, today, accessibleClientIds),
    listTeamMembers(user.businessId),
  ]);

  return (
    <div>
      <PageHeader
        icon={CalendarClock}
        tone="burnt"
        eyebrow="Follow-ups"
        title="Follow-ups"
        description="What's coming up and what's overdue, across every client and lead"
      />
      <FollowUpsWorkspace followUps={followUps} teamMembers={teamMembers} />
    </div>
  );
}
