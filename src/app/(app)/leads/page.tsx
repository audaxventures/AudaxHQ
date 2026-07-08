import { Plus, Target } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { LeadFilterBar } from "@/components/leads/LeadFilterBar";
import { LeadListRow } from "@/components/leads/LeadListRow";
import { LeadGridCard } from "@/components/leads/LeadGridCard";
import { listLeads, countLeads } from "@/lib/data/leads";
import { getBusinessToday } from "@/lib/data/businesses";
import { requireCurrentUser } from "@/lib/currentUser";
import type { LeadStatus } from "@/lib/types";

const PAGE_SIZE = 6;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; view?: string; page?: string }>;
}) {
  const { status, view, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const isGrid = view === "grid";
  const user = await requireCurrentUser();

  const [leads, total, today] = await Promise.all([
    listLeads(user.businessId, {
      status: status as LeadStatus | undefined,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    countLeads(user.businessId, { status: status as LeadStatus | undefined }),
    getBusinessToday(user.businessId),
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
        description="Your pipeline of prospective clients"
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
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} itemLabel="leads" buildHref={buildPageHref} />
    </div>
  );
}
