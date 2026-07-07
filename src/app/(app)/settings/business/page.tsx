import { Card } from "@/components/ui/Card";
import { SettingsPanelHeader } from "@/components/settings/SettingsPanelHeader";
import { BillingEntitiesPanel } from "@/components/settings/BillingEntitiesPanel";
import { listBillingEntities } from "@/lib/data/billingEntities";
import { requireOwner } from "@/lib/currentUser";

export default async function BusinessSettingsPage() {
  const user = await requireOwner();
  const entities = await listBillingEntities(user.businessId, { includeInactive: true });
  return (
    <Card className="p-6">
      <SettingsPanelHeader
        title="Business Info"
        description="The business/entity names you operate under. Archiving keeps a name intact on any historical record that already uses it — it just stops showing up as a choice going forward."
      />
      <BillingEntitiesPanel entities={entities} />
    </Card>
  );
}
