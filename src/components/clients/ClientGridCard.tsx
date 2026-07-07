import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { Badge, ClientStatusBadge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";
import { entityColorClass } from "@/lib/avatar";
import { cn } from "@/lib/cn";
import type { Client } from "@/lib/types";

export function ClientGridCard({
  client,
  hideBilling = false,
}: {
  client: Client & { unpaidInvoiceCount: number; invoiceCount: number };
  hideBilling?: boolean;
}) {
  return (
    <Link
      href={`/clients/${client.id}`}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl bg-white py-5 pl-6 pr-5 shadow-[0_1px_2px_rgba(16,29,51,0.04),0_8px_24px_-16px_rgba(16,29,51,0.15)] transition-colors hover:bg-cream-100/60"
    >
      <span
        className={cn("absolute inset-y-0 left-0 w-1.5", entityColorClass(client.color, client.companyName))}
      />
      <div className="flex items-center gap-3">
        <AvatarChip name={client.companyName} color={client.color} />
        <div className="min-w-0 flex-1">
          <p className="font-heading text-base font-medium text-navy-900 truncate">
            {client.companyName}
          </p>
          {client.contactName && (
            <p className="text-sm text-navy-400 truncate">{client.contactName}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ClientStatusBadge status={client.status} />
        <Badge tone="navy">{client.type === "PROJECT" ? "Project" : "Recurring"}</Badge>
        {!hideBilling && client.invoiceCount > 0 && (
          <Badge tone={client.unpaidInvoiceCount > 0 ? "gold" : "sage"}>
            {client.unpaidInvoiceCount > 0
              ? `${client.unpaidInvoiceCount} unpaid invoice${client.unpaidInvoiceCount === 1 ? "" : "s"}`
              : "All caught up"}
          </Badge>
        )}
      </div>
      <div className="flex items-end justify-between border-t border-navy-100 pt-3">
        {hideBilling ? (
          <span />
        ) : (
          <div>
            <p className="font-heading text-lg text-navy-900">{formatCurrency(client.rate)}</p>
            <p className="text-xs text-navy-400">{client.type === "RECURRING" ? "/ month" : "total"}</p>
          </div>
        )}
        <ChevronRight
          size={18}
          className="text-navy-300 group-hover:text-navy-500 transition-colors shrink-0"
        />
      </div>
    </Link>
  );
}
