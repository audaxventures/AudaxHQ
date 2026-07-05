import { Card } from "@/components/ui/Card";
import { PasscodeForm } from "@/components/settings/PasscodeForm";
import { getAppSettings } from "@/lib/data/appSettings";

export default async function PasscodeSettingsPage() {
  const settings = await getAppSettings();
  return (
    <Card className="p-6">
      <h3 className="mb-1 font-heading text-lg font-medium text-navy-900">Access</h3>
      <p className="mb-4 text-sm text-navy-500">
        {settings.hasCustomPasscode
          ? "This app's passcode is currently managed here in Settings."
          : "This app is currently using the passcode from your APP_PASSCODE environment variable. Setting a new one below switches it over to being managed here instead."}{" "}
        Changing it only affects future logins — anyone already signed in stays signed in.
      </p>
      <PasscodeForm />
    </Card>
  );
}
