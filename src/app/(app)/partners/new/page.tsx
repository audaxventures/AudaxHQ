import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { BackLink } from "@/components/ui/BackLink";
import { InfoNote } from "@/components/ui/InfoNote";
import { PartnerForm } from "@/components/partners/PartnerForm";
import { requireCurrentUser } from "@/lib/currentUser";

export default async function NewPartnerPage() {
  const user = await requireCurrentUser();
  // Creating a new partner stays owner-only even for a team member granted
  // Partners access — that grant is about seeing/working existing partners,
  // not standing up new referral relationships.
  if (user.role !== "OWNER") redirect("/partners");
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
