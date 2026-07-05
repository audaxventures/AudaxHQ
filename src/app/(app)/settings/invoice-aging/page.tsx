import { Card } from "@/components/ui/Card";
import { InvoiceAgingForm } from "@/components/settings/InvoiceAgingForm";
import { getAppSettings } from "@/lib/data/appSettings";

export default async function InvoiceAgingSettingsPage() {
  const settings = await getAppSettings();
  return (
    <Card className="p-6">
      <h3 className="mb-1 font-heading text-lg font-medium text-navy-900">Invoice Aging</h3>
      <p className="mb-4 text-sm text-navy-500">
        The day-count thresholds that split the Invoice Aging view into brackets, so urgency can be tuned without a
        code change.
      </p>
      <InvoiceAgingForm settings={settings} />
    </Card>
  );
}
