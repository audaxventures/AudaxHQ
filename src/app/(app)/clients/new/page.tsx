import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ClientForm } from "@/components/clients/ClientForm";

export default function NewClientPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Clients"
        title="New client"
        description="Add a client to start tracking their work and invoicing."
      />
      <Card className="p-6 max-w-2xl">
        <ClientForm submitLabel="Create client" />
      </Card>
    </div>
  );
}
