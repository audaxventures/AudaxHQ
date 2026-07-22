"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Input, Label, FieldGroup, Select } from "@/components/ui/Field";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// Runs in the visitor's browser, so use its local calendar day/month rather
// than forcing UTC — mirrors CostDateRangeFilter's reasoning.
function currentMonthBounds(): { from: string; to: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return { from: `${year}-${pad(month + 1)}-01`, to: `${year}-${pad(month + 1)}-${pad(lastDay)}` };
}

function yearToDateBounds(): { from: string; to: string } {
  const now = new Date();
  return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` };
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap",
        active
          ? "bg-navy-900 text-cream-50 border-navy-900"
          : "bg-transparent text-navy-600 border-navy-200 hover:border-navy-400"
      )}
    >
      {children}
    </button>
  );
}

/** Controls the date range + client shown on the Revenue Tracking overview, via dateFrom/dateTo/clientId URL params. */
export function RevenueFilters({
  dateFrom,
  dateTo,
  clientId,
  clients,
}: {
  dateFrom?: string;
  dateTo?: string;
  clientId?: string;
  clients: { id: string; companyName: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  const isAllTime = !dateFrom && !dateTo;

  function apply(next: { from?: string; to?: string; client?: string; allTime?: boolean }) {
    const params = new URLSearchParams();
    const client = "client" in next ? next.client : clientId;
    // Falls back to the current all-time state when a call doesn't touch
    // the date range at all (e.g. just switching the client filter) — so
    // that choice survives across other filter changes rather than
    // silently reverting to the this-month default the moment anything
    // else changes.
    const allTime = "allTime" in next ? next.allTime : isAllTime;
    if (allTime) {
      // Distinct from just omitting dateFrom/dateTo — that's read as "no
      // choice made yet" server-side and defaults back to this month.
      params.set("range", "all");
    } else {
      const from = "from" in next ? next.from : dateFrom;
      const to = "to" in next ? next.to : dateTo;
      if (from) params.set("dateFrom", from);
      if (to) params.set("dateTo", to);
    }
    if (client) params.set("clientId", client);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const month = currentMonthBounds();
  const ytd = yearToDateBounds();
  const isThisMonth = dateFrom === month.from && dateTo === month.to;
  const isYtd = dateFrom === ytd.from && dateTo === ytd.to;

  return (
    <div className="mb-5 flex flex-wrap items-end gap-2">
      <Pill active={isThisMonth} onClick={() => apply({ from: month.from, to: month.to, allTime: false })}>
        This month
      </Pill>
      <Pill active={isYtd} onClick={() => apply({ from: ytd.from, to: ytd.to, allTime: false })}>
        Year to date
      </Pill>
      <Pill active={isAllTime} onClick={() => apply({ allTime: true })}>
        All time
      </Pill>
      <span className="mx-1 hidden h-9 w-px bg-navy-200 sm:block" />
      <FieldGroup>
        <Label htmlFor="rev-from">From</Label>
        <Input
          id="rev-from"
          type="date"
          value={dateFrom ?? ""}
          onChange={(e) => apply({ from: e.target.value || undefined, allTime: false })}
          className="w-40"
        />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="rev-to">To</Label>
        <Input
          id="rev-to"
          type="date"
          value={dateTo ?? ""}
          onChange={(e) => apply({ to: e.target.value || undefined, allTime: false })}
          className="w-40"
        />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="rev-client">Client</Label>
        <Select
          id="rev-client"
          value={clientId ?? ""}
          onChange={(e) => apply({ client: e.target.value || undefined })}
          className="w-48"
        >
          <option value="">All clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.companyName}
            </option>
          ))}
        </Select>
      </FieldGroup>
    </div>
  );
}
