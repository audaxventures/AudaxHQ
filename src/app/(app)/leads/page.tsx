import { Plus, Target } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LeadFilterBar } from "@/components/leads/LeadFilterBar";
import { LeadListRow } from "@/components/leads/LeadListRow";
import { LeadGridCard } from "@/components/leads/LeadGridCard";
import { ConvertedLeadsDrawer } from "@/components/leads/ConvertedLeadsDrawer";
import { LostLeadsDrawer } from "@/components/leads/LostLeadsDrawer";
import { listConvertedLeads, listLeads, listLostLeads } from "@/lib/data/leads";
import { listLeadSources } from "@/lib/data/leadSources";
import { listTeamMembers } from "@/lib/data/teamMembers";
import { getBusinessToday } from "@/lib/data/businesses";
import { requireCurrentUser } from "@/lib/currentUser";
import type { LeadStatus } from "@/lib/types";

const UNASSIGNED_OWNER_TOKEN = "unassigned";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; view?: string; sources?: string; owners?: string }>;
}) {
  const { status, view, sources, owners } = await searchParams;
  const isGrid = view === "grid";
  const user = await requireCurrentUser();
  const sourceIds = sources ? sources.split(",").filter(Boolean) : [];
  const ownerValues = owners ? owners.split(",").filter(Boolean) : [];
  const includeUnassignedOwner = ownerValues.includes(UNASSIGNED_OWNER_TOKEN);
  const leadOwnerIds = ownerValues.filter((v) => v !== UNASSIGNED_OWNER_TOKEN);

  const [leads, convertedLeads, lostLeads, today, leadSources, teamMembers] = await Promise.all([
    listLeads(user.businessId, {
      status: status as LeadStatus | undefined,
      sourceIds,
      leadOwnerIds,
      includeUnassignedOwner,
    }),
    listConvertedLeads(user.businessId),
    listLostLeads(user.businessId),
    getBusinessToday(user.businessId),
    listLeadSources(user.businessId, { includeInactive: true }),
    listTeamMembers(user.businessId),
  ]);

  return (
    <div>
      <PageHeader
        icon={Target}
        tone="burnt"
        eyebrow="Leads"
        title="Leads"
        description="Your pipeline of prospective clients"
        action={
          <LinkButton href="/leads/new">
            <Plus size={16} /> New lead
          </LinkButton>
        }
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-[280px] flex-1">
          <LeadFilterBar
            status={status}
            view={view}
            sources={sources}
            leadSources={leadSources}
            owners={owners}
            teamMembers={teamMembers}
          />
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <LostLeadsDrawer leads={lostLeads} />
          <ConvertedLeadsDrawer leads={convertedLeads} />
        </div>
      </div>
      {leads.length === 0 ? (
        <EmptyState
          title="No leads match these filters"
          description="Try a different filter, or add your first lead."
          action={<LinkButton href="/leads/new">Add a lead</LinkButton>}
        />
      ) : isGrid ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leads.map((lead) => (
            <LeadGridCard key={lead.id} lead={lead} today={today} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <LeadListRow key={lead.id} lead={lead} today={today} />
          ))}
        </div>
      )}
    </div>
  );
}
