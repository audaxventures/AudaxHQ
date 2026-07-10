"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { TimeSeriesChart, type TimeSeriesPoint } from "@/components/admin/TimeSeriesChart";
import { cn } from "@/lib/cn";
import type { GrowthPoint } from "@/lib/data/admin";

const METRICS = [
  { key: "workspaces", label: "Workspaces" },
  { key: "users", label: "Users" },
] as const;

export function GrowthChartCard({ data }: { data: GrowthPoint[] }) {
  const [metric, setMetric] = useState<(typeof METRICS)[number]["key"]>("workspaces");
  const points: TimeSeriesPoint[] = data.map((d) => ({ label: d.label, value: d[metric] }));

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-lg font-medium text-navy-900">Growth</h3>
        <div className="flex rounded-lg border border-navy-200 p-0.5">
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMetric(m.key)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                metric === m.key ? "bg-navy-900 text-cream-50" : "text-navy-500 hover:bg-navy-100"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <TimeSeriesChart
        data={points}
        emptyTitle="No growth data yet"
        emptyDescription="Once workspaces start signing up, this will show cumulative growth over time."
      />
    </Card>
  );
}
