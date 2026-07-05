import { sql } from "@/lib/db";

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
      l.source_id, ls.name as source_name,
      count(*) as total,
      count(*) filter (where l.status = 'WON') as won,
      count(*) filter (where l.status = 'LOST') as lost,
      count(*) filter (where l.status not in ('WON', 'LOST')) as in_progress,
      coalesce(sum(l.estimated_value) filter (where l.status = 'WON'), 0) as won_value
    from leads l
    left join lead_sources ls on ls.id = l.source_id
    group by l.source_id, ls.name
  `;
  const stats = rows.map((r) => {
    const row = r as Record<string, unknown> & GroupRow;
    const sourceId = row.source_id as string | null;
    const sourceName = row.source_name as string | null;
    return toStat(sourceId ?? "NONE", sourceName ?? "Not set", row);
  });
  return sortStats(stats);
}

export async function getConversionByWorkType(): Promise<ConversionStat[]> {
  const rows = await sql`
    select
      l.work_type_id, wt.name as work_type_name,
      count(*) as total,
      count(*) filter (where l.status = 'WON') as won,
      count(*) filter (where l.status = 'LOST') as lost,
      count(*) filter (where l.status not in ('WON', 'LOST')) as in_progress,
      coalesce(sum(l.estimated_value) filter (where l.status = 'WON'), 0) as won_value
    from leads l
    left join work_types wt on wt.id = l.work_type_id
    group by l.work_type_id, wt.name
  `;
  const stats = rows.map((r) => {
    const row = r as Record<string, unknown> & GroupRow;
    const workTypeId = row.work_type_id as string | null;
    const workTypeName = row.work_type_name as string | null;
    return toStat(workTypeId ?? "NONE", workTypeName ?? "Not set", row);
  });
  return sortStats(stats);
}
