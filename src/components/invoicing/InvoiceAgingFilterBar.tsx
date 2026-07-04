import Link from "next/link";
import { cn } from "@/lib/cn";
import {
  CLIENT_TYPE_LABELS,
  CLIENT_TYPE_ORDER,
  INVOICE_AGE_BRACKET_LABELS,
  INVOICE_AGE_BRACKET_ORDER,
} from "@/lib/types";

interface CurrentFilters {
  clientType?: string;
  bracket?: string;
}

function buildHref(current: CurrentFilters, key: keyof CurrentFilters, value: string | undefined) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    if (v && k !== key) params.set(k, v);
  }
  if (value) params.set(key, value);
  const qs = params.toString();
  return qs ? `/invoices?${qs}` : "/invoices";
}

function FilterPill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm font-medium transition-colors border whitespace-nowrap",
        active
          ? "bg-navy-900 text-cream-50 border-navy-900"
          : "bg-transparent text-navy-600 border-navy-200 hover:border-navy-400"
      )}
    >
      {children}
    </Link>
  );
}

export function InvoiceAgingFilterBar({
  clientType,
  bracket,
}: {
  clientType?: string;
  bracket?: string;
}) {
  const current = { clientType, bracket };

  return (
    <div className="space-y-3 mb-6">
      <div className="flex flex-wrap gap-2 overflow-x-auto">
        <FilterPill href={buildHref(current, "clientType", undefined)} active={!clientType}>
          All client types
        </FilterPill>
        {CLIENT_TYPE_ORDER.map((t) => (
          <FilterPill key={t} href={buildHref(current, "clientType", t)} active={clientType === t}>
            {CLIENT_TYPE_LABELS[t]}
          </FilterPill>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 overflow-x-auto">
        <FilterPill href={buildHref(current, "bracket", undefined)} active={!bracket}>
          All ages
        </FilterPill>
        {INVOICE_AGE_BRACKET_ORDER.map((b) => (
          <FilterPill key={b} href={buildHref(current, "bracket", b)} active={bracket === b}>
            {INVOICE_AGE_BRACKET_LABELS[b]}
          </FilterPill>
        ))}
      </div>
    </div>
  );
}
