import { notFound } from "next/navigation";
import { getClient } from "@/lib/data/clients";
import { deleteClient } from "@/app/(app)/clients/actions";
import { Card } from "@/components/ui/Card";
import { ClientStatusBadge, Badge } from "@/components/ui/Badge";
import { ClientForm } from "@/components/clients/ClientForm";
import { ClientTasks } from "@/components/clients/ClientTasks";
import { ClientLinks } from "@/components/clients/ClientLinks";
import { NotesLog } from "@/components/NotesLog";
import { InvoiceForm } from "@/components/clients/InvoiceForm";
import { formatCurrency, monthName } from "@/lib/format";
import { Button } from "@/components/ui/Button";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const boundDeleteClient = deleteClient.bind(null, id);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-burnt-500 mb-2">
            Client
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl font-medium text-navy-900 leading-tight">
            {client.name}
          </h1>
          {client.company && <p className="mt-1 text-navy-500">{client.company}</p>}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <ClientStatusBadge status={client.status} />
            <Badge tone="navy">{client.type === "PROJECT" ? "Project-based" : "Recurring"}</Badge>
          </div>
        </div>
        <form action={boundDeleteClient}>
          <Button variant="danger" size="sm" type="submit">
            Delete client
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="font-heading text-lg font-medium text-navy-900 mb-4">Core info</h3>
            <ClientForm key={client.updatedAt} client={client} submitLabel="Save changes" />
          </Card>

          <Card className="p-6">
            <h3 className="font-heading text-lg font-medium text-navy-900 mb-1">Invoicing</h3>
            <p className="text-sm text-navy-500 mb-4">
              {client.type === "PROJECT"
                ? "Single project invoice."
                : "One entry per month, created automatically."}
            </p>
            {client.type === "PROJECT" ? (
              client.projectInvoice ? (
                <InvoiceForm
                  key={`${client.projectInvoice.status}-${client.projectInvoice.amount}-${client.projectInvoice.invoicedDate}-${client.projectInvoice.paidDate}`}
                  clientId={id}
                  amount={client.projectInvoice.amount}
                  status={client.projectInvoice.status}
                  invoicedDate={client.projectInvoice.invoicedDate}
                  paidDate={client.projectInvoice.paidDate}
                  amountLabel="Project total ($)"
                />
              ) : (
                <p className="text-sm text-navy-400">No invoice record yet.</p>
              )
            ) : (
              <div className="space-y-5">
                {client.recurringInvoices.length === 0 ? (
                  <p className="text-sm text-navy-400">No monthly invoices yet.</p>
                ) : (
                  client.recurringInvoices.map((inv) => (
                    <div key={inv.id} className="border-t border-navy-100 pt-4 first:border-t-0 first:pt-0">
                      <p className="text-sm font-medium text-navy-700 mb-2">
                        {monthName(inv.periodMonth)} {inv.periodYear}
                      </p>
                      <InvoiceForm
                        key={`${inv.id}-${inv.status}-${inv.amount}-${inv.invoicedDate}-${inv.paidDate}`}
                        clientId={id}
                        invoiceId={inv.id}
                        amount={inv.amount}
                        status={inv.status}
                        invoicedDate={inv.invoicedDate}
                        paidDate={inv.paidDate}
                        amountLabel="Amount ($)"
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="font-heading text-lg font-medium text-navy-900 mb-4">
              Activity &amp; notes
            </h3>
            <NotesLog notes={client.notes} kind="client" entityId={id} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-heading text-lg font-medium text-navy-900 mb-1">
              {client.type === "RECURRING" ? "Monthly fee" : "Project total"}
            </h3>
            <p className="font-heading text-2xl text-navy-900">{formatCurrency(client.rate)}</p>
          </Card>

          <Card className="p-6">
            <h3 className="font-heading text-lg font-medium text-navy-900 mb-3">
              Task checklist
            </h3>
            <ClientTasks clientId={id} tasks={client.tasks} />
          </Card>

          <Card className="p-6">
            <h3 className="font-heading text-lg font-medium text-navy-900 mb-3">Links</h3>
            <ClientLinks clientId={id} links={client.links} />
          </Card>
        </div>
      </div>
    </div>
  );
}
