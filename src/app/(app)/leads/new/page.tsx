import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { LeadForm } from "@/components/leads/LeadForm";

export default function NewLeadPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Leads"
        title="New lead"
        description="Add a prospective client to the pipeline."
      />
      <Card className="p-6 max-w-2xl">
        <LeadForm submitLabel="Create lead" />
      </Card>
    </div>
  );
}
