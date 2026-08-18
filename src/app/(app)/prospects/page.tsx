import { UserSearch } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProspectFilterBar } from "@/components/prospects/ProspectFilterBar";
import { ProspectsWorkspace } from "@/components/prospects/ProspectsWorkspace";
import { listDistinctIndustries, listProspects } from "@/lib/data/prospects";
import { listTeamMembers } from "@/lib/data/teamMembers";
import { getBusinessToday } from "@/lib/data/businesses";
import { requireCurrentUser } from "@/lib/currentUser";
import { buildAssignOptions, selfId } from "@/lib/assign";
import type { ProspectSort } from "@/lib/data/prospects";
import type { ProspectStatus } from "@/lib/types";

const UNASSIGNED_OWNER_TOKEN = "unassigned";

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; industry?: string; owners?: string; sort?: string; q?: string }>;
}) {
  const { status, industry, owners, sort, q } = await searchParams;
  const user = await requireCurrentUser();
  const ownerValues = owners ? owners.split(",").filter(Boolean) : [];
  const includeUnassignedOwner = ownerValues.includes(UNASSIGNED_OWNER_TOKEN);
  const ownerIds = ownerValues.filter((v) => v !== UNASSIGNED_OWNER_TOKEN);

  const [prospects, industries, teamMembers, today] = await Promise.all([
    listProspects(user.businessId, {
      status: status as ProspectStatus | undefined,
      industry,
      ownerIds,
      includeUnassignedOwner,
      sort: (sort || undefined) as ProspectSort | undefined,
      search: q,
    }),
    listDistinctIndustries(user.businessId),
    listTeamMembers(user.businessId),
    getBusinessToday(user.businessId),
  ]);

  const assignOptions = buildAssignOptions(user, teamMembers);
  const currentAssigneeId = selfId(user);

  return (
    <div>
      <PageHeader
        icon={UserSearch}
        tone="navy"
        eyebrow="Prospects"
        title="Prospects"
        description="People worth reaching out to, before they become a lead"
      />

      <div className="mb-6">
        <ProspectFilterBar
          status={status}
          industry={industry}
          industries={industries}
          owners={owners}
          teamMembers={teamMembers}
          sort={sort}
          q={q}
        />
      </div>

      <ProspectsWorkspace
        prospects={prospects}
        teamMembers={teamMembers}
        assignOptions={assignOptions}
        currentAssigneeId={currentAssigneeId}
        today={today}
      />
    </div>
  );
}
