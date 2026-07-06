import Link from "next/link";
import { Download } from "lucide-react";
import { cn } from "@/lib/cn";
import { CLIENT_TYPE_LABELS, CLIENT_TYPE_ORDER, INVOICE_AGE_BRACKET_ORDER } from "@/lib/types";
import type { InvoiceAgeBracket } from "@/lib/types";

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

function buildExportHref(current: CurrentFilters) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    if (v) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `/api/invoice-aging/export?${qs}` : "/api/invoice-aging/export";
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

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-navy-400">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function InvoiceAgingFilterBar({
  clientType,
  bracket,
  bracketLabels,
}: {
  clientType?: string;
  bracket?: string;
  bracketLabels: Record<InvoiceAgeBracket, string>;
}) {
  const current = { clientType, bracket };

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-wrap items-start gap-6">
        <FilterGroup label="Client type">
          <FilterPill href={buildHref(current, "clientType", undefined)} active={!clientType}>
            All client types
          </FilterPill>
          {CLIENT_TYPE_ORDER.map((t) => (
            <FilterPill key={t} href={buildHref(current, "clientType", t)} active={clientType === t}>
              {CLIENT_TYPE_LABELS[t]}
            </FilterPill>
          ))}
        </FilterGroup>
        <span className="mt-6 hidden h-8 w-px bg-navy-200 sm:block" />
        <FilterGroup label="Age">
          <FilterPill href={buildHref(current, "bracket", undefined)} active={!bracket}>
            All ages
          </FilterPill>
          {INVOICE_AGE_BRACKET_ORDER.map((b) => (
            <FilterPill key={b} href={buildHref(current, "bracket", b)} active={bracket === b}>
              {bracketLabels[b]}
            </FilterPill>
          ))}
        </FilterGroup>
      </div>
      <a
        href={buildExportHref(current)}
        className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-navy-200 px-3 py-1.5 text-sm font-medium text-navy-600 transition-colors hover:border-navy-400 hover:bg-navy-100/50 sm:mt-6"
      >
        <Download size={15} /> Export
      </a>
    </div>
  );
}
