import { Card } from "@/components/ui/Card";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { getProfile } from "@/lib/data/profile";

export default async function ProfileSettingsPage() {
  const profile = await getProfile();
  return (
    <Card className="p-6">
      <h3 className="mb-1 font-heading text-lg font-medium text-navy-900">Profile</h3>
      <p className="mb-4 text-sm text-navy-500">
        Your identity info — used for display purposes only (e.g. report headers, &ldquo;uploaded by&rdquo; on
        documents). No password or auth fields here since this is a single-user app.
      </p>
      <ProfileForm profile={profile} />
    </Card>
  );
}
