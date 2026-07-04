import { sql } from "@/lib/db";
import { LEAD_SOURCE_LABELS, WORK_TYPE_LABELS } from "@/lib/types";
import type { LeadSource, WorkType } from "@/lib/types";

export interface ConversionStat {
  key: string;
  label: string;
  total: number;
  won: number;
  lost: number;
  inProgress: number;
  /** Won / (Won + Lost) as a 0-100 percentage. Null when no lead from this
   * group has resolved yet, since a rate isn't meaningful without a
   * denominator. */
  winRate: number | null;
  wonValue: number;
}

interface GroupRow {
  total: string | number;
  won: string | number;
  lost: string | number;
  in_progress: string | number;
  won_value: string | number;
}

function toStat(key: string, label: string, row: GroupRow): ConversionStat {
  const won = Number(row.won);
  const lost = Number(row.lost);
  const resolved = won + lost;
  return {
    key,
    label,
    total: Number(row.total),
    won,
    lost,
    inProgress: Number(row.in_progress),
    winRate: resolved > 0 ? (won / resolved) * 100 : null,
    wonValue: Number(row.won_value),
  };
}

/** Highest win rate first; groups with no resolved leads yet sort to the
 * bottom, ordered by volume so the most active ones still surface. */
function sortStats(stats: ConversionStat[]): ConversionStat[] {
  return [...stats].sort((a, b) => {
    if (a.winRate === null && b.winRate === null) return b.total - a.total;
    if (a.winRate === null) return 1;
    if (b.winRate === null) return -1;
    return b.winRate - a.winRate;
  });
}

export async function getConversionBySource(): Promise<ConversionStat[]> {
  const rows = await sql`
    select
      source,
      count(*) as total,
      count(*) filter (where status = 'WON') as won,
      count(*) filter (where status = 'LOST') as lost,
      count(*) filter (where status not in ('WON', 'LOST')) as in_progress,
      coalesce(sum(estimated_value) filter (where status = 'WON'), 0) as won_value
    from leads
    group by source
  `;
  const stats = rows.map((r) => {
    const row = r as Record<string, unknown> & GroupRow;
    const source = row.source as LeadSource | null;
    return toStat(source ?? "NONE", source ? LEAD_SOURCE_LABELS[source] : "Not set", row);
  });
  return sortStats(stats);
}

export async function getConversionByWorkType(): Promise<ConversionStat[]> {
  const rows = await sql`
    select
      work_type,
      count(*) as total,
      count(*) filter (where status = 'WON') as won,
      count(*) filter (where status = 'LOST') as lost,
      count(*) filter (where status not in ('WON', 'LOST')) as in_progress,
      coalesce(sum(estimated_value) filter (where status = 'WON'), 0) as won_value
    from leads
    group by work_type
  `;
  const stats = rows.map((r) => {
    const row = r as Record<string, unknown> & GroupRow;
    const workType = row.work_type as WorkType | null;
    return toStat(workType ?? "NONE", workType ? WORK_TYPE_LABELS[workType] : "Not set", row);
  });
  return sortStats(stats);
}
