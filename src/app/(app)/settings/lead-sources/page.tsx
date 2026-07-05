import { Card } from "@/components/ui/Card";
import { SettingsPanelHeader } from "@/components/settings/SettingsPanelHeader";
import { NameListManager } from "@/components/settings/NameListManager";
import { listLeadSources } from "@/lib/data/leadSources";
import {
  activateLeadSource,
  createLeadSource,
  deactivateLeadSource,
  updateLeadSource,
} from "@/app/(app)/settings/actions";

export default async function LeadSourcesSettingsPage() {
  const leadSources = await listLeadSources({ includeInactive: true });
  return (
    <Card className="p-6">
      <SettingsPanelHeader title="Lead Sources" description="Where your leads come from. Used on the Lead form and Lead Analytics." />
      <NameListManager
        items={leadSources}
        addLabel="Add lead source"
        namePlaceholder="e.g. Referral"
        onCreate={createLeadSource}
        onUpdate={updateLeadSource}
        onActivate={activateLeadSource}
        onDeactivate={deactivateLeadSource}
      />
    </Card>
  );
}
