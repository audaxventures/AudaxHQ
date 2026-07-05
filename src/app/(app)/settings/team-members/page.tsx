import { Card } from "@/components/ui/Card";
import { TeamMembersPanel } from "@/components/settings/TeamMembersPanel";
import { listTeamMembers } from "@/lib/data/teamMembers";

export default async function TeamMembersSettingsPage() {
  const teamMembers = await listTeamMembers({ includeInactive: true });
  return (
    <Card className="p-6">
      <h3 className="mb-1 font-heading text-lg font-medium text-navy-900">Team Members</h3>
      <p className="mb-4 text-sm text-navy-500">
        Who can be logged against a time entry, and their default hourly rate. Deactivating someone removes them from
        the Tracker&rsquo;s team member picker without touching their past entries.
      </p>
      <TeamMembersPanel teamMembers={teamMembers} />
    </Card>
  );
}
