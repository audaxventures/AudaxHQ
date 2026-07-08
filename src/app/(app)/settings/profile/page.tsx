import { Card } from "@/components/ui/Card";
import { SettingsPanelHeader } from "@/components/settings/SettingsPanelHeader";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { BusinessLogoForm } from "@/components/settings/BusinessLogoForm";
import { requireOwner } from "@/lib/currentUser";
import { initials } from "@/lib/avatar";

export default async function ProfileSettingsPage() {
  const user = await requireOwner();
  const business = user.business;
  return (
    <Card className="p-6">
      <SettingsPanelHeader
        title="Profile"
        description={
          <>
            Your identity info — used for display purposes only (e.g. report headers, &ldquo;uploaded by&rdquo; on
            documents). No password or auth fields here since this is a single-user app.
          </>
        }
        action={
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy-100 text-base font-semibold text-navy-700">
            {initials(business.ownerName)}
          </div>
        }
      />
      <ProfileForm business={business} />
      <div className="mt-6 border-t border-navy-100 pt-6">
        <h3 className="mb-3 text-sm font-semibold text-navy-900">Business logo</h3>
        <BusinessLogoForm logoUrl={business.logoUrl} />
      </div>
    </Card>
  );
}
