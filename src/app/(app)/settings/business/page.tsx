import { Card } from "@/components/ui/Card";
import { SettingsPanelHeader } from "@/components/settings/SettingsPanelHeader";
import { BusinessNameForm } from "@/components/settings/BusinessNameForm";
import { BusinessLogoForm } from "@/components/settings/BusinessLogoForm";
import { requireOwner } from "@/lib/currentUser";

export default async function BusinessSettingsPage() {
  const user = await requireOwner();
  const business = user.business;
  return (
    <Card className="p-6">
      <SettingsPanelHeader
        title="Business Info"
        description="Your workspace's business name and logo."
      />
      <BusinessNameForm business={business} />
      <div className="mt-6 border-t border-navy-100 pt-6">
        <h3 className="mb-3 text-sm font-semibold text-navy-900">Business logo</h3>
        <BusinessLogoForm logoUrl={business.logoUrl} />
      </div>
    </Card>
  );
}
