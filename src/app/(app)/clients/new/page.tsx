import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { BackLink } from "@/components/ui/BackLink";
import { InfoNote } from "@/components/ui/InfoNote";
import { ClientForm } from "@/components/clients/ClientForm";
import { listWorkTypes } from "@/lib/data/workTypes";
import { requireCurrentUser } from "@/lib/currentUser";

export default async function NewClientPage() {
  const user = await requireCurrentUser();
  const workTypes = await listWorkTypes(user.businessId, { includeInactive: true });
  return (
    <div>
      <BackLink href="/clients" label="Back to clients" />
      <PageHeader
        eyebrow="Clients"
        title="New client"
        description="Add a client to start tracking their work and invoicing."
        action={
          <InfoNote>
            <p className="font-medium text-navy-900">Add the basic details for your new client.</p>
            <p className="text-navy-500">You can always update this information later.</p>
          </InfoNote>
        }
      />
      <Card className="p-6">
        <ClientForm
          workTypes={workTypes}
          submitLabel="Create client"
          cancelHref="/clients"
          hideRate={user.role === "TEAM_MEMBER"}
        />
      </Card>
    </div>
  );
}
