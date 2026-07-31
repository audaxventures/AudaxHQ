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
  /** Lifetime invoiced + paid revenue (everything but NOT_INVOICED) from the
   * clients that WON leads in this group converted into — not the leads'
   * original estimated value, which goes stale the moment actual pricing or
   * invoicing diverges from the guess made at lead-creation time. Grows over
   * time for recurring clients rather than being fixed at the point of win. */
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

export async function getConversionBySource(businessId: string): Promise<ConversionStat[]> {
  const rows = await sql`
    with client_revenue as (
      select client_id, sum(amount) as revenue
      from invoices
      where business_id = ${businessId} and status <> 'NOT_INVOICED'
      group by client_id
    )
    select
      l.source_id, ls.name as source_name,
      count(*) as total,
      count(*) filter (where l.status = 'WON') as won,
      count(*) filter (where l.status = 'LOST') as lost,
      count(*) filter (where l.status not in ('WON', 'LOST')) as in_progress,
      coalesce(sum(cr.revenue) filter (where l.status = 'WON'), 0) as won_value
    from leads l
    left join lead_sources ls on ls.id = l.source_id
    left join client_revenue cr on cr.client_id = l.converted_client_id
    where l.business_id = ${businessId}
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

/** Same shape as getConversionBySource, scoped to leads a referral partner sent in — answers "which partners are actually worth the commission" by showing real won revenue, not just referral counts. Leads with no referring partner are excluded (unlike source/work-type, a "Not set" bucket here would just be "most leads," not a meaningful comparison). */
export async function getConversionByPartner(businessId: string): Promise<ConversionStat[]> {
  const rows = await sql`
    with client_revenue as (
      select client_id, sum(amount) as revenue
      from invoices
      where business_id = ${businessId} and status <> 'NOT_INVOICED'
      group by client_id
    )
    select
      l.referred_by_partner_id, p.company_name as partner_name,
      count(*) as total,
      count(*) filter (where l.status = 'WON') as won,
      count(*) filter (where l.status = 'LOST') as lost,
      count(*) filter (where l.status not in ('WON', 'LOST')) as in_progress,
      coalesce(sum(cr.revenue) filter (where l.status = 'WON'), 0) as won_value
    from leads l
    join partners p on p.id = l.referred_by_partner_id
    left join client_revenue cr on cr.client_id = l.converted_client_id
    where l.business_id = ${businessId} and l.referred_by_partner_id is not null
    group by l.referred_by_partner_id, p.company_name
  `;
  const stats = rows.map((r) => {
    const row = r as Record<string, unknown> & GroupRow;
    return toStat(row.referred_by_partner_id as string, row.partner_name as string, row);
  });
  return sortStats(stats);
}

export interface ProspectFunnelSummary {
  total: number;
  /** Still being worked — NEW/CONTACTED/ATTEMPTED/QUALIFIED. */
  inPipeline: number;
  converted: number;
  notInterested: number;
  /** Converted / (Converted + Not interested) as a 0-100 percentage — null until at least one prospect has resolved either way. */
  conversionRate: number | null;
  /** Average calendar days from a prospect's creation to its conversion, across only the ones that have converted. Null until at least one has. */
  avgDaysToConvert: number | null;
}

/** Top-line prospect → lead funnel numbers for the Insights page — how much is in the pipeline, how much of it resolves into a lead, and how fast. */
export async function getProspectFunnelSummary(businessId: string): Promise<ProspectFunnelSummary> {
  const rows = await sql`
    select
      count(*) as total,
      count(*) filter (where status in ('NEW', 'CONTACTED', 'ATTEMPTED', 'QUALIFIED')) as in_pipeline,
      count(*) filter (where status = 'CONVERTED') as converted,
      count(*) filter (where status = 'NOT_INTERESTED') as not_interested,
      avg(extract(epoch from (converted_at - created_at)) / 86400.0) filter (where converted_at is not null) as avg_days_to_convert
    from prospects
    where business_id = ${businessId}
  `;
  const row = rows[0] as Record<string, unknown>;
  const converted = Number(row.converted);
  const notInterested = Number(row.not_interested);
  const resolved = converted + notInterested;
  const avgDays = row.avg_days_to_convert;
  return {
    total: Number(row.total),
    inPipeline: Number(row.in_pipeline),
    converted,
    notInterested,
    conversionRate: resolved > 0 ? (converted / resolved) * 100 : null,
    avgDaysToConvert: avgDays !== null ? Number(avgDays) : null,
  };
}

/**
 * Same ConversionStat shape as the lead breakdowns, repurposed one funnel
 * stage earlier: "won" = converted to a lead, "lost" = marked not
 * interested, "won revenue" = actual client revenue traced two hops down
 * the chain (prospect → the lead it became → the client that lead won),
 * via the same client_revenue join the lead breakdowns use.
 */
export async function getProspectConversionByIndustry(businessId: string): Promise<ConversionStat[]> {
  const rows = await sql`
    with client_revenue as (
      select client_id, sum(amount) as revenue
      from invoices
      where business_id = ${businessId} and status <> 'NOT_INVOICED'
      group by client_id
    )
    select
      p.industry,
      count(*) as total,
      count(*) filter (where p.status = 'CONVERTED') as won,
      count(*) filter (where p.status = 'NOT_INTERESTED') as lost,
      count(*) filter (where p.status not in ('CONVERTED', 'NOT_INTERESTED')) as in_progress,
      coalesce(sum(cr.revenue) filter (where p.status = 'CONVERTED'), 0) as won_value
    from prospects p
    left join leads l on l.id = p.converted_lead_id
    left join client_revenue cr on cr.client_id = l.converted_client_id
    where p.business_id = ${businessId}
    group by p.industry
  `;
  const stats = rows.map((r) => {
    const row = r as Record<string, unknown> & GroupRow;
    const industry = row.industry as string | null;
    return toStat(industry ?? "NONE", industry ?? "Not set", row);
  });
  return sortStats(stats);
}

/** Same as getProspectConversionByIndustry, grouped by who owns the prospect — surfaces which team member's outreach actually turns into pipeline. */
export async function getProspectConversionByOwner(businessId: string): Promise<ConversionStat[]> {
  const rows = await sql`
    with client_revenue as (
      select client_id, sum(amount) as revenue
      from invoices
      where business_id = ${businessId} and status <> 'NOT_INVOICED'
      group by client_id
    )
    select
      p.owner_team_member_id, tm.name as owner_name,
      count(*) as total,
      count(*) filter (where p.status = 'CONVERTED') as won,
      count(*) filter (where p.status = 'NOT_INTERESTED') as lost,
      count(*) filter (where p.status not in ('CONVERTED', 'NOT_INTERESTED')) as in_progress,
      coalesce(sum(cr.revenue) filter (where p.status = 'CONVERTED'), 0) as won_value
    from prospects p
    left join team_members tm on tm.id = p.owner_team_member_id
    left join leads l on l.id = p.converted_lead_id
    left join client_revenue cr on cr.client_id = l.converted_client_id
    where p.business_id = ${businessId}
    group by p.owner_team_member_id, tm.name
  `;
  const stats = rows.map((r) => {
    const row = r as Record<string, unknown> & GroupRow;
    const ownerId = row.owner_team_member_id as string | null;
    const ownerName = row.owner_name as string | null;
    return toStat(ownerId ?? "NONE", ownerName ?? "Unassigned", row);
  });
  return sortStats(stats);
}

export async function getConversionByWorkType(businessId: string): Promise<ConversionStat[]> {
  const rows = await sql`
    with client_revenue as (
      select client_id, sum(amount) as revenue
      from invoices
      where business_id = ${businessId} and status <> 'NOT_INVOICED'
      group by client_id
    )
    select
      l.work_type_id, wt.name as work_type_name,
      count(*) as total,
      count(*) filter (where l.status = 'WON') as won,
      count(*) filter (where l.status = 'LOST') as lost,
      count(*) filter (where l.status not in ('WON', 'LOST')) as in_progress,
      coalesce(sum(cr.revenue) filter (where l.status = 'WON'), 0) as won_value
    from leads l
    left join work_types wt on wt.id = l.work_type_id
    left join client_revenue cr on cr.client_id = l.converted_client_id
    where l.business_id = ${businessId}
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
