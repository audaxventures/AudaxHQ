import { Card } from "@/components/ui/Card";
import { SettingsPanelHeader } from "@/components/settings/SettingsPanelHeader";
import { TeamMembersPanel } from "@/components/settings/TeamMembersPanel";
import { listTeamMembers } from "@/lib/data/teamMembers";
import { listAllClientAccess } from "@/lib/data/clientAccess";
import { listClients } from "@/lib/data/clients";

export default async function TeamMembersSettingsPage() {
  const [teamMembers, clients, clientAccess] = await Promise.all([
    listTeamMembers({ includeInactive: true }),
    listClients(),
    listAllClientAccess(),
  ]);
  return (
    <Card className="p-6">
      <SettingsPanelHeader
        title="Team Members"
        description="Who can be logged against a time entry, their default hourly rate, and — for anyone given their own login — which clients they can see and work on."
      />
      <TeamMembersPanel
        teamMembers={teamMembers}
        clients={clients.map((c) => ({ id: c.id, companyName: c.companyName }))}
        clientAccess={clientAccess}
      />
    </Card>
  );
}
