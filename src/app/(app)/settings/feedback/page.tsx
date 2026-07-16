import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeedbackStatusBadge } from "@/components/ui/Badge";
import { SettingsPanelHeader } from "@/components/settings/SettingsPanelHeader";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { DeleteFeedbackButton } from "@/components/feedback/DeleteFeedbackButton";
import { listFeedbackForBusiness } from "@/lib/data/feedback";
import { requireOwner } from "@/lib/currentUser";
import { formatDate } from "@/lib/format";

export default async function FeedbackSettingsPage() {
  const user = await requireOwner();
  const submissions = await listFeedbackForBusiness(user.businessId);

  return (
    <Card className="p-6">
      <SettingsPanelHeader
        title="Feedback"
        description="Tell us what's working, what's broken, or what you wish Verclara could do."
      />

      <div className="mb-6">
        <FeedbackForm />
      </div>

      <h3 className="mb-4 font-heading text-lg font-medium text-navy-900">Your submissions</h3>
      {submissions.length === 0 ? (
        <EmptyState title="Nothing submitted yet" description="Anything you send in will show up here, along with its status." />
      ) : (
        <div className="space-y-3">
          {submissions.map((f) => (
            <div key={f.id} className="rounded-xl border border-navy-100 p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <p className="text-xs text-navy-400">
                  {f.submittedByName} · {formatDate(f.createdAt)}
                </p>
                <div className="flex items-center gap-3">
                  <FeedbackStatusBadge status={f.status} />
                  <DeleteFeedbackButton feedbackId={f.id} />
                </div>
              </div>
              <p className="text-sm text-navy-700 whitespace-pre-wrap">{f.message}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
