"use client";

import { TimeSeriesChart, type TimeSeriesPoint } from "@/components/admin/TimeSeriesChart";
import { formatCurrency } from "@/lib/format";

/** Wraps TimeSeriesChart with a currency formatter defined here — a Server Component can't pass a closure like `valueFormatter` as a prop to a Client Component, only plain data. */
export function RevenueTrendChart({ data }: { data: TimeSeriesPoint[] }) {
  return (
    <TimeSeriesChart
      data={data}
      valueFormatter={(v) => formatCurrency(v)}
      emptyTitle="No paid revenue yet"
      emptyDescription="Paid invoices will show up here month by month."
    />
  );
}
