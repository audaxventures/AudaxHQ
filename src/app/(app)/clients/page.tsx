import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClientFilterBar } from "@/components/clients/ClientFilterBar";
import { ClientListRow } from "@/components/clients/ClientListRow";
import { ClientGridCard } from "@/components/clients/ClientGridCard";
import { listClients } from "@/lib/data/clients";
import { accessibleClientIdsFor } from "@/lib/data/clientAccess";
import { requireCurrentUser } from "@/lib/currentUser";
import type { ClientStatus, ClientType } from "@/lib/types";
import { Plus, Users } from "lucide-react";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; view?: string }>;
}) {
  const { status, type, view } = await searchParams;
  const isGrid = view === "grid";

  const user = await requireCurrentUser();
  const isTeamMember = user.role === "TEAM_MEMBER";
  const accessibleClientIds = await accessibleClientIdsFor(user);

  const clients = await listClients(user.businessId, {
    status: status as ClientStatus | undefined,
    type: type as ClientType | undefined,
    accessibleClientIds,
  });

  return (
    <div>
      <PageHeader
        icon={Users}
        tone="slate"
        eyebrow="Clients"
        title="Clients"
        description="Everyone you're actively doing business with"
        action={
          <LinkButton href="/clients/new">
            <Plus size={16} /> New client
          </LinkButton>
        }
      />
      <ClientFilterBar status={status} type={type} view={view} />
      {clients.length === 0 ? (
        <EmptyState
          title="No clients match these filters"
          description="Try a different filter, or add your first client."
          action={<LinkButton href="/clients/new">Add a client</LinkButton>}
        />
      ) : isGrid ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <ClientGridCard key={client.id} client={client} hideBilling={isTeamMember} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <ClientListRow key={client.id} client={client} hideBilling={isTeamMember} />
          ))}
        </div>
      )}
    </div>
  );
}
