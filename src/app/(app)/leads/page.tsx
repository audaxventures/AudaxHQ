import { Plus, Target } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LeadFilterBar } from "@/components/leads/LeadFilterBar";
import { LeadListRow } from "@/components/leads/LeadListRow";
import { LeadGridCard } from "@/components/leads/LeadGridCard";
import { ConvertedLeadsDrawer } from "@/components/leads/ConvertedLeadsDrawer";
import { listConvertedLeads, listLeads } from "@/lib/data/leads";
import { listLeadSources } from "@/lib/data/leadSources";
import { getBusinessToday } from "@/lib/data/businesses";
import { requireCurrentUser } from "@/lib/currentUser";
import type { LeadStatus } from "@/lib/types";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; view?: string; sources?: string }>;
}) {
  const { status, view, sources } = await searchParams;
  const isGrid = view === "grid";
  const user = await requireCurrentUser();
  const sourceIds = sources ? sources.split(",").filter(Boolean) : [];

  const [leads, convertedLeads, today, leadSources] = await Promise.all([
    listLeads(user.businessId, { status: status as LeadStatus | undefined, sourceIds }),
    listConvertedLeads(user.businessId),
    getBusinessToday(user.businessId),
    listLeadSources(user.businessId, { includeInactive: true }),
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
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <LeadFilterBar status={status} view={view} sources={sources} leadSources={leadSources} />
        <ConvertedLeadsDrawer leads={convertedLeads} />
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
