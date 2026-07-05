import { Card } from "@/components/ui/Card";
import { SettingsPanelHeader } from "@/components/settings/SettingsPanelHeader";
import { PasscodeForm } from "@/components/settings/PasscodeForm";
import { getAppSettings } from "@/lib/data/appSettings";

export default async function PasscodeSettingsPage() {
  const settings = await getAppSettings();
  return (
    <Card className="p-6">
      <SettingsPanelHeader
        title="Access"
        description={
          <>
            {settings.hasCustomPasscode
              ? "This app's passcode is currently managed here in Settings."
              : "This app is currently using the passcode from your APP_PASSCODE environment variable. Setting a new one below switches it over to being managed here instead."}{" "}
            Changing it only affects future logins — anyone already signed in stays signed in.
          </>
        }
      />
      <PasscodeForm />
    </Card>
  );
}
