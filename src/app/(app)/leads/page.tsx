import { Plus, Target } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LeadFilterBar } from "@/components/leads/LeadFilterBar";
import { LeadListRow } from "@/components/leads/LeadListRow";
import { listLeads } from "@/lib/data/leads";
import type { LeadStatus } from "@/lib/types";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const leads = await listLeads({ status: status as LeadStatus | undefined });

  return (
    <div>
      <PageHeader
        icon={Target}
        tone="burnt"
        eyebrow="Leads"
        title="Leads"
        description="Your pipeline of prospective clients, sorted by who needs a follow-up next."
        action={
          <LinkButton href="/leads/new">
            <Plus size={16} /> New lead
          </LinkButton>
        }
      />
      <LeadFilterBar status={status} />
      {leads.length === 0 ? (
        <EmptyState
          title="No leads match these filters"
          description="Try a different filter, or add your first lead."
          action={<LinkButton href="/leads/new">Add a lead</LinkButton>}
        />
      ) : (
        <Card tone="burnt" className="divide-y divide-navy-100 overflow-hidden">
          {leads.map((lead) => (
            <LeadListRow key={lead.id} lead={lead} />
          ))}
        </Card>
      )}
    </div>
  );
}
