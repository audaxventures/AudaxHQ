import { Card } from "@/components/ui/Card";
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
      <h3 className="mb-1 font-heading text-lg font-medium text-navy-900">Lead Sources</h3>
      <p className="mb-4 text-sm text-navy-500">Where your leads come from. Used on the Lead form and Lead Analytics.</p>
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
