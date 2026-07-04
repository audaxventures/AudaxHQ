import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { Badge, ClientStatusBadge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";
import type { Client } from "@/lib/types";

export function ClientListRow({
  client,
}: {
  client: Client & { unpaidInvoiceCount: number; invoiceCount: number };
}) {
  return (
    <Link
      href={`/clients/${client.id}`}
      className="group flex items-center gap-4 px-5 py-4 hover:bg-cream-100/60 transition-colors"
    >
      <AvatarChip name={client.companyName} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-heading text-base font-medium text-navy-900 truncate">
            {client.companyName}
          </p>
          {client.contactName && (
            <span className="text-sm text-navy-400 truncate">{client.contactName}</span>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <ClientStatusBadge status={client.status} />
          <Badge tone="navy">{client.type === "PROJECT" ? "Project" : "Recurring"}</Badge>
          {client.invoiceCount > 0 && (
            <Badge tone={client.unpaidInvoiceCount > 0 ? "gold" : "sage"}>
              {client.unpaidInvoiceCount > 0
                ? `${client.unpaidInvoiceCount} unpaid invoice${client.unpaidInvoiceCount === 1 ? "" : "s"}`
                : "All caught up"}
            </Badge>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="font-heading text-base text-navy-900">{formatCurrency(client.rate)}</p>
        <p className="text-xs text-navy-400">{client.type === "RECURRING" ? "/ month" : "total"}</p>
      </div>
      <ChevronRight
        size={18}
        className="text-navy-300 group-hover:text-navy-500 transition-colors shrink-0"
      />
    </Link>
  );
}
