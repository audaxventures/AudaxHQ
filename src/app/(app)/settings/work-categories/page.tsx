import { Card } from "@/components/ui/Card";
import { SettingsPanelHeader } from "@/components/settings/SettingsPanelHeader";
import { WorkCategoriesPanel } from "@/components/settings/WorkCategoriesPanel";
import { listWorkCategories } from "@/lib/data/workCategories";

export default async function WorkCategoriesSettingsPage() {
  const categories = await listWorkCategories({ includeInactive: true });
  return (
    <Card className="p-6">
      <SettingsPanelHeader
        title="Work Categories"
        description="The categories used to tag time entries in the Hour & Cost Tracker, each with its own default hourly rate. Deactivating one removes it from the Tracker's category picker without touching past entries."
      />
      <WorkCategoriesPanel categories={categories} />
    </Card>
  );
}
