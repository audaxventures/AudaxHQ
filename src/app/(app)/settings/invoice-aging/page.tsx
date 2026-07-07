import { Card } from "@/components/ui/Card";
import { SettingsPanelHeader } from "@/components/settings/SettingsPanelHeader";
import { InvoiceAgingForm } from "@/components/settings/InvoiceAgingForm";
import { requireOwner } from "@/lib/currentUser";

export default async function InvoiceAgingSettingsPage() {
  const user = await requireOwner();
  const settings = user.business;
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
