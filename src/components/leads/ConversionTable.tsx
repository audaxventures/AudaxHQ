import type { ConversionStat } from "@/lib/data/leadAnalytics";
import { formatCurrency } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";

export function ConversionTable({
  groupLabel,
  stats,
}: {
  groupLabel: string;
  stats: ConversionStat[];
}) {
  if (stats.length === 0) {
    return <EmptyState title="No leads yet" description="Breakdowns will appear once you add leads." />;
  }

  const hasWonValue = stats.some((s) => s.wonValue > 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-navy-100 text-left text-xs font-medium uppercase tracking-wide text-navy-400">
            <th className="py-2 pr-4">{groupLabel}</th>
            <th className="py-2 pr-4">Win rate</th>
            <th className="py-2 pr-4">In progress</th>
            <th className="py-2 pr-4">Total leads</th>
            {hasWonValue && <th className="py-2 pl-4 text-right">Won value</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-100">
          {stats.map((s) => (
            <tr key={s.key}>
              <td className="py-3 pr-4 font-medium text-navy-900 whitespace-nowrap">{s.label}</td>
              <td className="py-3 pr-4">
                {s.winRate !== null ? (
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-navy-100">
                        <div
                          className="h-full rounded-full bg-sage-600"
                          style={{ width: `${Math.round(s.winRate)}%` }}
                        />
                      </div>
                      <span className="font-heading text-base font-medium text-navy-900 tabular-nums">
                        {Math.round(s.winRate)}%
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-navy-400">
                      {s.won} won · {s.lost} lost
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-navy-400">No resolved leads yet</p>
                )}
              </td>
              <td className="py-3 pr-4 text-navy-600 tabular-nums">{s.inProgress}</td>
              <td className="py-3 pr-4 text-navy-600 tabular-nums">{s.total}</td>
              {hasWonValue && (
                <td className="py-3 pl-4 text-right font-medium text-navy-900 tabular-nums">
                  {s.wonValue > 0 ? formatCurrency(s.wonValue) : "—"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
