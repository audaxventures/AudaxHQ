import { notFound } from "next/navigation";
import { IdCard, CalendarClock, NotebookPen, FileText, DollarSign, Target, BarChart3, StickyNote } from "lucide-react";
import { getPartner } from "@/lib/data/partners";
import { listTasks } from "@/lib/data/todos";
import { getBusinessToday } from "@/lib/data/businesses";
import { requireCurrentUser, senderFirstName } from "@/lib/currentUser";
import { deletePartner, setPartnerActive, setPartnerColor } from "@/app/(app)/partners/actions";
import { Card } from "@/components/ui/Card";
import { PanelHeading } from "@/components/ui/PanelHeading";
import { RecordSectionTabs, type SectionTab } from "@/components/ui/RecordSectionTabs";
import { BackLink } from "@/components/ui/BackLink";
import { Badge } from "@/components/ui/Badge";
import { EntityColorPicker } from "@/components/ui/EntityColorPicker";
import { PartnerForm } from "@/components/partners/PartnerForm";
import { ReferredLeadsList } from "@/components/partners/ReferredLeadsList";
import { CommissionsSection } from "@/components/partners/CommissionsSection";
import { EmailSection } from "@/components/EmailSection";
import { FollowUpsList } from "@/components/FollowUpsList";
import { MeetingNotesSection } from "@/components/MeetingNotesSection";
import { DocumentsSection } from "@/components/DocumentsSection";
import { ScopedTaskList } from "@/components/ScopedTaskList";
import { NotesLog } from "@/components/NotesLog";
import { Button } from "@/components/ui/Button";
import { formatDate, formatCurrency } from "@/lib/format";
import { buildAssignOptions, selfId } from "@/lib/assign";
import { mentionOptions } from "@/lib/mentions";
import { listTeamMembers } from "@/lib/data/teamMembers";

export default async function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCurrentUser();
  // Same "not found" treatment as a client a team member has no access to
  // (clients/[id]/page.tsx) rather than an ugly thrown-error page.
  if (user.role === "TEAM_MEMBER" && !user.teamMember.hasPartnersAccess) notFound();
  const [partner, today, teamMembers, tasks] = await Promise.all([
    getPartner(id, user.businessId),
    getBusinessToday(user.businessId),
    listTeamMembers(user.businessId),
    listTasks(user.businessId, { partnerId: id, includeExternal: true }),
  ]);
  if (!partner) notFound();

  const assignOptions = buildAssignOptions(user, teamMembers);
  const currentAssigneeId = selfId(user);
  const owner = { type: "PARTNER" as const, partnerId: id };
  const boundDeletePartner = deletePartner.bind(null, id);
  const boundSetActive = setPartnerActive.bind(null, id);
  // Partners have no per-team-member access list to check against (like
  // leads, unlike clients) — every active, login-enabled team member is
  // eligible to be @mentioned.
  const noteMentionOptions = mentionOptions(
    user,
    teamMembers.filter((t) => t.hasLogin),
    null
  );

  const partnerSectionTabs: SectionTab[] = [
    {
      key: "referrals",
      label: "Referrals",
      icon: <Target size={15} />,
      color: "sage",
      count: partner.referredLeads.length,
      content: <ReferredLeadsList leads={partner.referredLeads} />,
    },
    {
      key: "follow-ups",
      label: "Tasks & Follow-ups",
      icon: <CalendarClock size={15} />,
      color: "burnt",
      count: partner.followUps.length,
      content: (
        <>
          <div>
            <h4 className="mb-3 font-heading text-base font-bold text-navy-900">Tasks</h4>
            <ScopedTaskList owner={owner} tasks={tasks} today={today} />
          </div>
          <div className="mt-8 border-t-2 border-navy-100 pt-6">
            <h4 className="mb-3 font-heading text-base font-bold text-navy-900">Follow-ups</h4>
            <FollowUpsList
              owner={{ partnerId: id }}
              followUps={partner.followUps}
              today={today}
              assignOptions={assignOptions}
              currentAssigneeId={currentAssigneeId}
            />
          </div>
        </>
      ),
    },
    {
      key: "meetings-notes",
      label: "Meeting Notes",
      icon: <NotebookPen size={15} />,
      color: "violet",
      count: partner.meetingNotes.length,
      content: (
        <MeetingNotesSection
          owner={owner}
          notes={partner.meetingNotes}
          today={today}
          senderFirstName={senderFirstName(user)}
          defaultTimezone={user.business.timezone}
        />
      ),
    },
    {
      key: "finance",
      label: "Finance",
      icon: <DollarSign size={15} />,
      color: "gold",
      count: partner.commissions.length,
      content: (
        <CommissionsSection
          partnerId={id}
          commissions={partner.commissions}
          referredLeads={partner.referredLeads}
          revenueGenerated={partner.revenueGenerated}
          today={today}
        />
      ),
    },
    {
      key: "documents",
      label: "Documents",
      icon: <FileText size={15} />,
      color: "blue",
      count: partner.documents.length,
      content: <DocumentsSection owner={{ partnerId: id }} documents={partner.documents} />,
    },
    {
      key: "discussion-notes",
      label: "Notes & Activity",
      icon: <StickyNote size={15} />,
      color: "slate",
      count: partner.notes.length,
      content: <NotesLog notes={partner.notes} kind="partner" entityId={id} mentionables={noteMentionOptions} />,
    },
  ];

  return (
    <div>
      <BackLink href="/partners" label="Back to partners" />
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-burnt-500 mb-2">Partner</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-medium text-navy-900 leading-tight">
            {partner.companyName}
          </h1>
          {partner.contactName && <p className="mt-1 text-navy-500">{partner.contactName}</p>}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <EntityColorPicker color={partner.color} onSelect={setPartnerColor.bind(null, id)} />
            <Badge tone={partner.active ? "sage" : "slate"}>{partner.active ? "Active" : "Inactive"}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <form action={boundSetActive.bind(null, !partner.active)}>
            <Button variant="secondary" size="sm" type="submit">
              {partner.active ? "Mark inactive" : "Mark active"}
            </Button>
          </form>
          <form action={boundDeletePartner}>
            <Button variant="danger" size="sm" type="submit">
              Delete
            </Button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <PanelHeading icon={IdCard} tone="slate" title="Core information" />
            <PartnerForm key={partner.updatedAt} partner={partner} submitLabel="Save changes" variant="compact" />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <PanelHeading icon={BarChart3} tone="slate" title="At a glance" />
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-navy-500">Revenue generated</dt>
                <dd className="font-heading text-base font-medium text-sage-700">
                  {formatCurrency(partner.revenueGenerated)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-navy-500">Referrals sent</dt>
                <dd className="text-navy-800 font-medium">{partner.referredLeads.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-navy-500">Partner since</dt>
                <dd className="text-navy-800 font-medium">{formatDate(partner.createdAt)}</dd>
              </div>
            </dl>
          </Card>

          <EmailSection
            contactEmail={partner.contactEmail}
            contactName={partner.contactName}
            companyName={partner.companyName}
          />
        </div>
      </div>

      <div className="mt-6">
        <RecordSectionTabs storageKey="record-detail" tabs={partnerSectionTabs} />
      </div>
    </div>
  );
}
