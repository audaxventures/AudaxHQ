import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClientFilterBar } from "@/components/clients/ClientFilterBar";
import { ClientListRow } from "@/components/clients/ClientListRow";
import { listClients } from "@/lib/data/clients";
import type { ClientStatus, ClientType } from "@/lib/types";
import { Plus, Users } from "lucide-react";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const { status, type } = await searchParams;
  const clients = await listClients({
    status: status as ClientStatus | undefined,
    type: type as ClientType | undefined,
  });

  return (
    <div>
      <PageHeader
        icon={Users}
        tone="slate"
        eyebrow="Clients"
        title="Clients"
        description="Everyone you're currently working with, and everyone you used to."
        action={
          <LinkButton href="/clients/new">
            <Plus size={16} /> New client
          </LinkButton>
        }
      />
      <ClientFilterBar status={status} type={type} />
      {clients.length === 0 ? (
        <EmptyState
          title="No clients match these filters"
          description="Try a different filter, or add your first client."
          action={<LinkButton href="/clients/new">Add a client</LinkButton>}
        />
      ) : (
        <Card tone="slate" className="divide-y divide-navy-100 overflow-hidden">
          {clients.map((client) => (
            <ClientListRow key={client.id} client={client} />
          ))}
        </Card>
      )}
    </div>
  );
}
