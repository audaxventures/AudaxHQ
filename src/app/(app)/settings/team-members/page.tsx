import { Card } from "@/components/ui/Card";
import { SettingsPanelHeader } from "@/components/settings/SettingsPanelHeader";
import { TeamMembersPanel } from "@/components/settings/TeamMembersPanel";
import { listTeamMembers } from "@/lib/data/teamMembers";

export default async function TeamMembersSettingsPage() {
  const teamMembers = await listTeamMembers({ includeInactive: true });
  return (
    <Card className="p-6">
      <SettingsPanelHeader
        title="Team Members"
        description="Who can be logged against a time entry, and their default hourly rate. Deactivating someone removes them from the Tracker's team member picker without touching their past entries."
      />
      <TeamMembersPanel teamMembers={teamMembers} />
    </Card>
  );
}
