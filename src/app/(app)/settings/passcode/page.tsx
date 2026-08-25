import { Card } from "@/components/ui/Card";
import { SettingsPanelHeader } from "@/components/settings/SettingsPanelHeader";
import { PasscodeForm } from "@/components/settings/PasscodeForm";
import { changeTeamMemberPasscode } from "@/app/(app)/settings/actions";
import { requireCurrentUser } from "@/lib/currentUser";

export default async function PasscodeSettingsPage() {
  const user = await requireCurrentUser();
  return (
    <Card className="p-6">
      <SettingsPanelHeader
        title="Access"
        description="This app's password is managed here in Settings. Changing it only affects future logins — anyone already signed in stays signed in."
      />
      <PasscodeForm action={user.role === "TEAM_MEMBER" ? changeTeamMemberPasscode : undefined} />
    </Card>
  );
}
