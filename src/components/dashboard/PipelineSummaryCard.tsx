import Link from "next/link";
import { ArrowRight, Flag, MessageSquare, Send, Target, Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { LeadPipelineSummary } from "@/lib/data/leads";

const STAGES = [
  { key: "newCount" as const, label: "New", icon: Flag, iconClasses: "bg-navy-100 text-navy-700", barClasses: "bg-navy-500" },
  { key: "proposalCount" as const, label: "Proposal", icon: Send, iconClasses: "bg-gold-100 text-gold-600", barClasses: "bg-gold-600" },
  {
    key: "negotiatingCount" as const,
    label: "Negotiating",
    icon: MessageSquare,
    iconClasses: "bg-burnt-100 text-burnt-600",
    barClasses: "bg-burnt-500",
  },
];

export function PipelineSummaryCard({ summary }: { summary: LeadPipelineSummary }) {
  const activeTotal = summary.newCount + summary.proposalCount + summary.negotiatingCount;

  return (
    <Card tone="navy" className="p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-navy-100 text-navy-700">
          <Target size={14} />
        </div>
        <h3 className="font-heading text-base font-medium text-navy-900">Pipeline Summary</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAGES.map((stage) => (
          <div key={stage.key} className="rounded-xl bg-white/70 p-3">
            <span className={cn("mb-2 flex h-7 w-7 items-center justify-center rounded-lg", stage.iconClasses)}>
              <stage.icon size={14} />
            </span>
            <p className="font-heading text-xl font-semibold text-navy-900 tabular-nums">{summary[stage.key]}</p>
            <p className="text-xs font-medium text-navy-500">{stage.label}</p>
          </div>
        ))}
        <div className="rounded-xl bg-white/70 p-3">
          <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-sage-100 text-sage-600">
            <Trophy size={14} />
          </span>
          <p className="font-heading text-xl font-semibold text-navy-900 tabular-nums">{summary.wonCount}</p>
          <p className="text-xs font-medium text-navy-500">Won this month</p>
        </div>
      </div>

      {activeTotal > 0 && (
        <div className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-navy-100">
          {STAGES.map((stage) => (
            <div
              key={stage.key}
              className={stage.barClasses}
              style={{ width: `${(summary[stage.key] / activeTotal) * 100}%` }}
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="font-heading text-lg text-navy-900">{formatCurrency(summary.pipelineValue)}</p>
          <p className="text-xs text-navy-400">Active pipeline value</p>
        </div>
        <Link
          href="/leads"
          className="inline-flex items-center gap-1 text-xs font-medium text-burnt-600 hover:underline"
        >
          View pipeline <ArrowRight size={12} />
        </Link>
      </div>
    </Card>
  );
}
