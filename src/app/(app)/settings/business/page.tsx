import { Card } from "@/components/ui/Card";
import { SettingsPanelHeader } from "@/components/settings/SettingsPanelHeader";
import { BusinessEntitiesPanel } from "@/components/settings/BusinessEntitiesPanel";
import { listBusinessEntities } from "@/lib/data/businessEntities";

export default async function BusinessSettingsPage() {
  const entities = await listBusinessEntities({ includeInactive: true });
  return (
    <Card className="p-6">
      <SettingsPanelHeader
        title="Business Info"
        description="The business/entity names you operate under. Archiving keeps a name intact on any historical record that already uses it — it just stops showing up as a choice going forward."
      />
      <BusinessEntitiesPanel entities={entities} />
    </Card>
  );
}
