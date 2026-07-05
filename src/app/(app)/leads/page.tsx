import { Plus, Target } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { LeadFilterBar } from "@/components/leads/LeadFilterBar";
import { LeadListRow } from "@/components/leads/LeadListRow";
import { LeadGridCard } from "@/components/leads/LeadGridCard";
import { listLeads, countLeads } from "@/lib/data/leads";
import type { LeadStatus } from "@/lib/types";

const PAGE_SIZE = 10;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; view?: string; page?: string }>;
}) {
  const { status, view, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const isGrid = view === "grid";

  const [leads, total] = await Promise.all([
    listLeads({
      status: status as LeadStatus | undefined,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    countLeads({ status: status as LeadStatus | undefined }),
  ]);

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (view) params.set("view", view);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `/leads?${qs}` : "/leads";
  };

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
      <LeadFilterBar status={status} view={view} />
      {leads.length === 0 ? (
        <EmptyState
          title="No leads match these filters"
          description="Try a different filter, or add your first lead."
          action={<LinkButton href="/leads/new">Add a lead</LinkButton>}
        />
      ) : isGrid ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leads.map((lead) => (
            <LeadGridCard key={lead.id} lead={lead} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <LeadListRow key={lead.id} lead={lead} />
          ))}
        </div>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} itemLabel="leads" buildHref={buildPageHref} />
    </div>
  );
}
