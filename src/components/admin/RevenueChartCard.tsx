"use client";

import { Card } from "@/components/ui/Card";
import { TimeSeriesChart, type TimeSeriesPoint } from "@/components/admin/TimeSeriesChart";
import { formatCurrency } from "@/lib/format";

/** Wraps TimeSeriesChart with a currency formatter defined here — a Server Component can't pass a closure like `valueFormatter` as a prop to a Client Component, only plain data (see RevenueTrendChart for the same pattern). */
export function RevenueChartCard({ data }: { data: TimeSeriesPoint[] }) {
  return (
    <Card className="p-6">
      <h3 className="mb-4 font-heading text-lg font-medium text-navy-900">Revenue</h3>
      <TimeSeriesChart
        data={data}
        color="#55637a"
        fillColor="#e7eaf0"
        valueFormatter={(v) => formatCurrency(v)}
        emptyTitle="No revenue collected yet"
        emptyDescription="Every subscription starts with a 7-day trial — this fills in once the first trial converts to a paid charge."
      />
    </Card>
  );
}
