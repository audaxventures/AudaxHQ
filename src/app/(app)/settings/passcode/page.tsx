import { Card } from "@/components/ui/Card";
import { SettingsPanelHeader } from "@/components/settings/SettingsPanelHeader";
import { PasscodeForm } from "@/components/settings/PasscodeForm";

export default function PasscodeSettingsPage() {
  return (
    <Card className="p-6">
      <SettingsPanelHeader
        title="Access"
        description="This app's passcode is managed here in Settings. Changing it only affects future logins — anyone already signed in stays signed in."
      />
      <PasscodeForm />
    </Card>
  );
}
