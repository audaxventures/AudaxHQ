import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeedbackStatusSelect } from "@/components/admin/FeedbackStatusSelect";
import { DeleteFeedbackButton } from "@/components/admin/DeleteFeedbackButton";
import { listAllFeedback } from "@/lib/data/admin";
import { formatDate } from "@/lib/format";

export default async function AdminFeedbackPage() {
  const submissions = await listAllFeedback();

  return (
    <Card className="p-6">
      {submissions.length === 0 ? (
        <EmptyState title="No feedback yet" description="Submissions from any workspace will show up here." />
      ) : (
        <div className="space-y-3">
          {submissions.map((f) => (
            <div key={f.id} className="rounded-xl border border-navy-100 p-4">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/admin/workspace/${f.businessId}`} className="text-sm font-medium text-navy-900 hover:text-burnt-600">
                    {f.businessName}
                  </Link>
                  <p className="text-xs text-navy-400">
                    {f.submittedByName} ({f.submittedByRole === "OWNER" ? "Owner" : "Team member"}) · {formatDate(f.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <FeedbackStatusSelect feedbackId={f.id} status={f.status} />
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
