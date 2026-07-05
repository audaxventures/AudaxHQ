import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { BackLink } from "@/components/ui/BackLink";
import { InfoNote } from "@/components/ui/InfoNote";
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
      <BackLink href="/leads" label="Back to leads" />
      <PageHeader
        eyebrow="Leads"
        title="New lead"
        description="Add a prospective client to the pipeline."
        action={
          <InfoNote>
            <p className="font-medium text-navy-900">Add the basic details for your new lead.</p>
            <p className="text-navy-500">You can always update this information later.</p>
          </InfoNote>
        }
      />
      <Card className="p-6">
        <LeadForm
          workTypes={workTypes}
          leadSources={leadSources}
          submitLabel="Create lead"
          cancelHref="/leads"
        />
      </Card>
    </div>
  );
}
