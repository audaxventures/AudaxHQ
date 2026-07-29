import { Card } from "@/components/ui/Card";
import { SettingsPanelHeader } from "@/components/settings/SettingsPanelHeader";
import { TeamMembersPanel } from "@/components/settings/TeamMembersPanel";
import { listTeamMembers } from "@/lib/data/teamMembers";
import { listAllClientAccess } from "@/lib/data/clientAccess";
import { listClients } from "@/lib/data/clients";
import { requireOwner } from "@/lib/currentUser";

export default async function TeamMembersSettingsPage() {
  const user = await requireOwner();
  const [allTeamMembers, clients, clientAccess] = await Promise.all([
    listTeamMembers(user.businessId, { includeInactive: true }),
    listClients(user.businessId),
    listAllClientAccess(user.businessId),
  ]);
  // The owner has their own hidden team_members row (rate, tag color — edited
  // from Settings > Profile instead), not a real team member to manage here.
  const teamMembers = allTeamMembers.filter((t) => t.id !== user.business.ownerTeamMemberId);
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
