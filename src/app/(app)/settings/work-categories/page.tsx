import { Card } from "@/components/ui/Card";
import { WorkCategoriesPanel } from "@/components/settings/WorkCategoriesPanel";
import { listWorkCategories } from "@/lib/data/workCategories";

export default async function WorkCategoriesSettingsPage() {
  const categories = await listWorkCategories({ includeInactive: true });
  return (
    <Card className="p-6">
      <h3 className="mb-1 font-heading text-lg font-medium text-navy-900">Work Categories</h3>
      <p className="mb-4 text-sm text-navy-500">
        The categories used to tag time entries in the Hour &amp; Cost Tracker, each with its own default hourly
        rate. Deactivating one removes it from the Tracker&rsquo;s category picker without touching past entries.
      </p>
      <WorkCategoriesPanel categories={categories} />
    </Card>
  );
}
