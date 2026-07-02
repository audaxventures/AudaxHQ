import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ClientForm } from "@/components/clients/ClientForm";
import { getLead } from "@/lib/data/leads";
import type { Client } from "@/lib/types";

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ fromLead?: string }>;
}) {
  const { fromLead } = await searchParams;

  let prefill: Partial<Client> | undefined;
  if (fromLead) {
    const lead = await getLead(fromLead);
    if (!lead) notFound();
    prefill = {
      name: lead.name,
      company: lead.company,
      contactEmail: lead.contactEmail,
      contactPhone: lead.contactPhone,
      rate: lead.estimatedValue ?? undefined,
    };
  }

  return (
    <div>
      <PageHeader
        eyebrow="Clients"
        title={fromLead ? "Convert lead to client" : "New client"}
        description={
          fromLead
            ? "We've pre-filled what we know from the lead — confirm the details below."
            : "Add a client to start tracking their work and invoicing."
        }
      />
      <Card className="p-6 max-w-2xl">
        <ClientForm
          submitLabel="Create client"
          fromLeadId={fromLead}
          client={prefill as Client | undefined}
        />
      </Card>
    </div>
  );
}
