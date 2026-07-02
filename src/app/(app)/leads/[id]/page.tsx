import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getLead } from "@/lib/data/leads";
import { deleteLead } from "@/app/(app)/leads/actions";
import { Card } from "@/components/ui/Card";
import { LeadStatusBadge } from "@/components/ui/Badge";
import { LeadForm } from "@/components/leads/LeadForm";
import { NotesLog } from "@/components/NotesLog";
import { Button, LinkButton } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();

  const boundDeleteLead = deleteLead.bind(null, id);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-burnt-500 mb-2">
            Lead
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl font-medium text-navy-900 leading-tight">
            {lead.name}
          </h1>
          {lead.company && <p className="mt-1 text-navy-500">{lead.company}</p>}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <LeadStatusBadge status={lead.status} />
            {lead.estimatedValue && (
              <span className="text-sm text-navy-500">
                Est. {formatCurrency(lead.estimatedValue)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lead.status === "WON" && !lead.convertedClientId && (
            <LinkButton href={`/clients/new?fromLead=${lead.id}`} variant="primary" size="sm">
              Convert to client <ArrowRight size={15} />
            </LinkButton>
          )}
          {lead.convertedClientId && (
            <LinkButton href={`/clients/${lead.convertedClientId}`} variant="secondary" size="sm">
              View client <ArrowRight size={15} />
            </LinkButton>
          )}
          <form action={boundDeleteLead}>
            <Button variant="danger" size="sm" type="submit">
              Delete
            </Button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="font-heading text-lg font-medium text-navy-900 mb-4">Core info</h3>
            <LeadForm key={lead.updatedAt} lead={lead} submitLabel="Save changes" />
          </Card>

          <Card className="p-6">
            <h3 className="font-heading text-lg font-medium text-navy-900 mb-4">
              Activity &amp; notes
            </h3>
            <NotesLog notes={lead.notes} kind="lead" entityId={id} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-heading text-lg font-medium text-navy-900 mb-3">At a glance</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-navy-500">Next follow-up</dt>
                <dd className="text-navy-800 font-medium">{formatDate(lead.nextFollowUpDate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-navy-500">Estimated value</dt>
                <dd className="text-navy-800 font-medium">
                  {lead.estimatedValue ? formatCurrency(lead.estimatedValue) : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-navy-500">In pipeline since</dt>
                <dd className="text-navy-800 font-medium">{formatDate(lead.createdAt)}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
