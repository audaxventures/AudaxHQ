import { Card } from "@/components/ui/Card";
import { NameListManager } from "@/components/settings/NameListManager";
import { listWorkTypes } from "@/lib/data/workTypes";
import {
  activateWorkType,
  createWorkType,
  deactivateWorkType,
  updateWorkType,
} from "@/app/(app)/settings/actions";

export default async function WorkTypesSettingsPage() {
  const workTypes = await listWorkTypes({ includeInactive: true });
  return (
    <Card className="p-6">
      <h3 className="mb-1 font-heading text-lg font-medium text-navy-900">Client &amp; Lead Work Types</h3>
      <p className="mb-4 text-sm text-navy-500">
        The shared work type / service options used by both Client and Lead forms — a lead converting to a client
        carries the same value forward. The &ldquo;Other&rdquo; row always shows a free-text field when selected, no
        matter what it&rsquo;s renamed to.
      </p>
      <NameListManager
        items={workTypes}
        addLabel="Add work type"
        namePlaceholder="e.g. Website Development"
        onCreate={createWorkType}
        onUpdate={updateWorkType}
        onActivate={activateWorkType}
        onDeactivate={deactivateWorkType}
      />
    </Card>
  );
}
