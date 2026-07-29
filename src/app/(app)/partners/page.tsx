import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PartnerFilterBar } from "@/components/partners/PartnerFilterBar";
import { PartnerListRow } from "@/components/partners/PartnerListRow";
import { PartnerGridCard } from "@/components/partners/PartnerGridCard";
import { listPartners } from "@/lib/data/partners";
import { requireOwner } from "@/lib/currentUser";
import { Plus, Handshake } from "lucide-react";

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; view?: string }>;
}) {
  const { status, view } = await searchParams;
  const isGrid = view === "grid";

  const user = await requireOwner();
  const partners = await listPartners(user.businessId, { includeInactive: status === "all" });

  return (
    <div>
      <PageHeader
        icon={Handshake}
        tone="slate"
        eyebrow="Partners"
        title="Referral partners"
        description="Strategic partners you work with and the referrals they send"
        action={
          <LinkButton href="/partners/new">
            <Plus size={16} /> New partner
          </LinkButton>
        }
      />
      <PartnerFilterBar status={status} view={view} />
      {partners.length === 0 ? (
        <EmptyState
          title={status === "all" ? "No partners yet" : "No active partners"}
          description="Add a strategic partner to start tracking meetings, referrals, and commissions."
          action={<LinkButton href="/partners/new">Add a partner</LinkButton>}
        />
      ) : isGrid ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((partner) => (
            <PartnerGridCard key={partner.id} partner={partner} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {partners.map((partner) => (
            <PartnerListRow key={partner.id} partner={partner} />
          ))}
        </div>
      )}
    </div>
  );
}
