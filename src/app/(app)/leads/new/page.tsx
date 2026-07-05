import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { LeadForm } from "@/components/leads/LeadForm";
import { listWorkTypes } from "@/lib/data/workTypes";
import { listLeadSources } from "@/lib/data/leadSources";

export default async function NewLeadPage() {
  const [workTypes, leadSources] = await Promise.all([
    listWorkTypes({ includeInactive: true }),
    listLeadSources({ includeInactive: true }),
  ]);
  return (
    <div>
      <PageHeader
        eyebrow="Leads"
        title="New lead"
        description="Add a prospective client to the pipeline."
      />
      <Card className="p-6 max-w-2xl">
        <LeadForm workTypes={workTypes} leadSources={leadSources} submitLabel="Create lead" />
      </Card>
    </div>
  );
}
