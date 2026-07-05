import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ClientForm } from "@/components/clients/ClientForm";
import { listWorkTypes } from "@/lib/data/workTypes";

export default async function NewClientPage() {
  const workTypes = await listWorkTypes({ includeInactive: true });
  return (
    <div>
      <PageHeader
        eyebrow="Clients"
        title="New client"
        description="Add a client to start tracking their work and invoicing."
      />
      <Card className="p-6 max-w-2xl">
        <ClientForm workTypes={workTypes} submitLabel="Create client" />
      </Card>
    </div>
  );
}
