import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PartnerFilterBar } from "@/components/partners/PartnerFilterBar";
import { PartnerListRow } from "@/components/partners/PartnerListRow";
import { PartnerGridCard } from "@/components/partners/PartnerGridCard";
import { listPartners } from "@/lib/data/partners";
import { requireCurrentUser } from "@/lib/currentUser";
import { Plus, Handshake } from "lucide-react";

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; view?: string }>;
}) {
  const { status, view } = await searchParams;
  const isGrid = view === "grid";

  const user = await requireCurrentUser();
  const isOwner = user.role === "OWNER";
  // Team members without Partners access are bounced to / (same landing spot
  // proxy.ts used to redirect them to before this became a granular,
  // per-team-member permission — see requirePartnerAccess in currentUser.ts).
  if (!isOwner && !user.teamMember.hasPartnersAccess) redirect("/");
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
          isOwner ? (
            <LinkButton href="/partners/new">
              <Plus size={16} /> New partner
            </LinkButton>
          ) : undefined
        }
      />
      <PartnerFilterBar status={status} view={view} />
      {partners.length === 0 ? (
        <EmptyState
          title={status === "all" ? "No partners yet" : "No active partners"}
          description="Add a strategic partner to start tracking meetings, referrals, and commissions."
          action={isOwner ? <LinkButton href="/partners/new">Add a partner</LinkButton> : undefined}
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
