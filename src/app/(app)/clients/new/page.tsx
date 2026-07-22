import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { BackLink } from "@/components/ui/BackLink";
import { InfoNote } from "@/components/ui/InfoNote";
import { ClientForm } from "@/components/clients/ClientForm";
import { listWorkTypes } from "@/lib/data/workTypes";
import { listTeamMembers } from "@/lib/data/teamMembers";
import { requireCurrentUser } from "@/lib/currentUser";

export default async function NewClientPage() {
  const user = await requireCurrentUser();
  const workTypes = await listWorkTypes(user.businessId, { includeInactive: true });
  // Team-member access is owner-managed everywhere else, so the "Give
  // access to" checklist only makes sense (and is only fetched) for an
  // owner — a team member creating a client never sees it. Only active
  // members with a login can actually use client_access, so those are
  // the only ones worth offering here.
  const teamMembers = user.role === "OWNER" ? (await listTeamMembers(user.businessId)).filter((t) => t.hasLogin) : [];
  return (
    <div>
      <BackLink href="/clients" label="Back to clients" />
      <PageHeader
        eyebrow="Clients"
        title="New client"
        description="Add a client to start tracking their work and invoicing."
        action={
          <InfoNote>
            <p className="font-medium text-navy-900">Add the basic details for your new client.</p>
            <p className="text-navy-500">You can always update this information later.</p>
          </InfoNote>
        }
      />
      <Card className="p-6">
        <ClientForm
          workTypes={workTypes}
          teamMembers={teamMembers}
          submitLabel="Create client"
          cancelHref="/clients"
          hideRate={user.role === "TEAM_MEMBER"}
        />
      </Card>
    </div>
  );
}
