"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Input, Label, FieldGroup } from "@/components/ui/Field";

function currentMonthBounds(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
        active
          ? "bg-navy-900 text-cream-50 border-navy-900"
          : "bg-transparent text-navy-600 border-navy-200 hover:border-navy-400"
      )}
    >
      {children}
    </button>
  );
}

/** Controls the date range shown in a Cost & Profitability section, via costFrom/costTo URL params. */
export function CostDateRangeFilter({ dateFrom, dateTo }: { dateFrom?: string; dateTo?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  function apply(from: string | undefined, to: string | undefined) {
    const params = new URLSearchParams();
    if (from) params.set("costFrom", from);
    if (to) params.set("costTo", to);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const month = currentMonthBounds();
  const isAllTime = !dateFrom && !dateTo;
  const isThisMonth = dateFrom === month.from && dateTo === month.to;

  return (
    <div className="mb-4 flex flex-wrap items-end gap-2">
      <Pill active={isAllTime} onClick={() => apply(undefined, undefined)}>
        All time
      </Pill>
      <Pill active={isThisMonth} onClick={() => apply(month.from, month.to)}>
        This month
      </Pill>
      <span className="mx-1 hidden h-9 w-px bg-navy-200 sm:block" />
      <FieldGroup>
        <Label htmlFor="cost-from">From</Label>
        <Input
          id="cost-from"
          type="date"
          value={dateFrom ?? ""}
          onChange={(e) => apply(e.target.value || undefined, dateTo)}
          className="w-40"
        />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="cost-to">To</Label>
        <Input
          id="cost-to"
          type="date"
          value={dateTo ?? ""}
          onChange={(e) => apply(dateFrom, e.target.value || undefined)}
          className="w-40"
        />
      </FieldGroup>
    </div>
  );
}
