import { MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeedbackStatusBadge } from "@/components/ui/Badge";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { listFeedbackForBusiness } from "@/lib/data/feedback";
import { requireCurrentUser } from "@/lib/currentUser";
import { formatDate } from "@/lib/format";

export default async function FeedbackPage() {
  const user = await requireCurrentUser();
  const submissions = await listFeedbackForBusiness(user.businessId);

  return (
    <div>
      <PageHeader
        icon={MessageSquare}
        tone="slate"
        eyebrow="Feedback"
        title="Feedback & feature requests"
        description="Tell us what's working, what's broken, or what you wish Audax HQ could do."
      />

      <Card className="p-6 mb-6">
        <FeedbackForm />
      </Card>

      <Card className="p-6">
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
                  <FeedbackStatusBadge status={f.status} />
                </div>
                <p className="text-sm text-navy-700 whitespace-pre-wrap">{f.message}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
