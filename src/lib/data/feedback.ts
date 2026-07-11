import { sql } from "@/lib/db";
import type { Feedback, SessionRole } from "@/lib/types";

function mapFeedback(row: Record<string, unknown>): Feedback {
  return {
    id: row.id as string,
    businessId: row.business_id as string,
    submittedByName: row.submitted_by_name as string,
    submittedByRole: row.submitted_by_role as SessionRole,
    message: row.message as string,
    status: row.status as Feedback["status"],
    createdAt: row.created_at as string,
  };
}

export interface FeedbackInput {
  submittedByName: string;
  submittedByRole: SessionRole;
  message: string;
}

export async function createFeedback(businessId: string, input: FeedbackInput): Promise<Feedback> {
  const rows = await sql`
    insert into feedback (business_id, submitted_by_name, submitted_by_role, message)
    values (${businessId}, ${input.submittedByName}, ${input.submittedByRole}, ${input.message})
    returning *
  `;
  return mapFeedback(rows[0] as Record<string, unknown>);
}

/** A workspace's own submissions, newest first — shown back to them on the Feedback page so they can see the status of what they've sent in. */
export async function listFeedbackForBusiness(businessId: string): Promise<Feedback[]> {
  const rows = await sql`
    select * from feedback where business_id = ${businessId} order by created_at desc
  `;
  return rows.map((r) => mapFeedback(r as Record<string, unknown>));
}

/** Scoped by businessId so a workspace can only delete its own submissions. */
export async function deleteFeedback(businessId: string, feedbackId: string): Promise<void> {
  await sql`delete from feedback where id = ${feedbackId} and business_id = ${businessId}`;
}
