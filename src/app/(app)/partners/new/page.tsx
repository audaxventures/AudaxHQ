import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { BackLink } from "@/components/ui/BackLink";
import { InfoNote } from "@/components/ui/InfoNote";
import { PartnerForm } from "@/components/partners/PartnerForm";
import { requireOwner } from "@/lib/currentUser";

export default async function NewPartnerPage() {
  await requireOwner();
  return (
    <div>
      <BackLink href="/partners" label="Back to partners" />
      <PageHeader
        eyebrow="Partners"
        title="New partner"
        description="Add a strategic referral partner."
        action={
          <InfoNote>
            <p className="font-medium text-navy-900">Add the basic details for your new partner.</p>
            <p className="text-navy-500">You can always update this information later.</p>
          </InfoNote>
        }
      />
      <Card className="p-6">
        <PartnerForm submitLabel="Create partner" cancelHref="/partners" />
      </Card>
    </div>
  );
}
