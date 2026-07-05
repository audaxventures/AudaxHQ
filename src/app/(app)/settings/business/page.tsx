import { Card } from "@/components/ui/Card";
import { BusinessEntitiesPanel } from "@/components/settings/BusinessEntitiesPanel";
import { listBusinessEntities } from "@/lib/data/businessEntities";

export default async function BusinessSettingsPage() {
  const entities = await listBusinessEntities({ includeInactive: true });
  return (
    <Card className="p-6">
      <h3 className="mb-1 font-heading text-lg font-medium text-navy-900">Business Info</h3>
      <p className="mb-4 text-sm text-navy-500">
        The business/entity names you operate under. Archiving keeps a name intact on any historical record that
        already uses it — it just stops showing up as a choice going forward.
      </p>
      <BusinessEntitiesPanel entities={entities} />
    </Card>
  );
}
