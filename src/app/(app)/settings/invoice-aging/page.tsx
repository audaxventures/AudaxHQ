import { Card } from "@/components/ui/Card";
import { SettingsPanelHeader } from "@/components/settings/SettingsPanelHeader";
import { InvoiceAgingForm } from "@/components/settings/InvoiceAgingForm";
import { getAppSettings } from "@/lib/data/appSettings";

export default async function InvoiceAgingSettingsPage() {
  const settings = await getAppSettings();
  return (
    <Card className="p-6">
      <SettingsPanelHeader
        title="Invoice Aging"
        description="The day-count thresholds that split the Invoice Aging view into brackets, so urgency can be tuned without a code change."
      />
      <InvoiceAgingForm settings={settings} />
    </Card>
  );
}
