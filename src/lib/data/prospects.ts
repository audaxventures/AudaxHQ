import { sql } from "@/lib/db";
import { createLead } from "@/lib/data/leads";
import type { EntityColor, FollowUp, Prospect, ProspectActivity, ProspectActivityType, ProspectStatus, ProspectWithRelations } from "@/lib/types";

function mapProspect(row: Record<string, unknown>): Prospect {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string | null,
    phone: row.phone as string | null,
    businessName: row.business_name as string | null,
    title: row.title as string | null,
    industry: row.industry as string | null,
    status: row.status as ProspectStatus,
    notes: row.notes as string | null,
    ownerTeamMemberId: (row.owner_team_member_id as string | null) ?? null,
    ownerName: (row.owner_name as string | null) ?? null,
    ownerColor: (row.owner_color as EntityColor | null) ?? null,
    convertedLeadId: row.converted_lead_id as string | null,
    convertedAt: row.converted_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    hot: row.hot as boolean,
  };
}

export type ProspectSort = "next_follow_up" | "name" | "owner" | "industry" | "created";

export interface ProspectFilters {
  status?: ProspectStatus;
  /** Exact (case-insensitive) match against industry — the filter dropdown is populated from listDistinctIndustries. */
  industry?: string;
  /** Multi-select: prospects whose owner_team_member_id is any of these. Undefined/empty (with includeUnassignedOwner falsy) = no restriction. */
  ownerIds?: string[];
  /** Include prospects with no owner set — combines with ownerIds (OR'd together), not a replacement for it. */
  includeUnassignedOwner?: boolean;
  search?: string;
  sort?: ProspectSort;
  /**
   * Prospects that have already been converted to a lead are, from this
   * point on, worked on as a lead — they default to hidden everywhere a
   * prospect list is used to pick something to act on, mirroring how
   * listLeads hides already-client-converted leads by default. Pass
   * "include" for views that need full history.
   */
  converted?: "exclude" | "include";
}

/**
 * Returns every prospect matching the filters, each with its full activity
 * log and follow-ups eagerly attached (via json_agg subqueries, same
 * approach as meeting_notes' action_item_tasks) — prospects have no detail
 * page, so the list page needs everything up front to open a fully
 * populated drawer with no second round trip.
 */
export async function listProspects(
  businessId: string,
  filters: ProspectFilters = {}
): Promise<(ProspectWithRelations & { nextFollowUpDate: string | null })[]> {
  const ownerIds = filters.ownerIds && filters.ownerIds.length > 0 ? filters.ownerIds : null;
  const includeUnassignedOwner = filters.includeUnassignedOwner ?? false;
  const searchPattern = filters.search ? `%${filters.search}%` : null;
  const sort = filters.sort ?? "next_follow_up";
  const rows = await sql`
    select p.*, tm.name as owner_name, tm.color as owner_color, f.next_date as next_follow_up_date,
      coalesce(
        (
          select json_agg(
            json_build_object(
              'id', a.id, 'prospectId', a.prospect_id, 'type', a.type, 'body', a.body,
              'createdAt', a.created_at, 'loggedByTeamMemberId', a.logged_by_team_member_id,
              'loggedByName', atm.name
            )
            order by a.created_at desc
          )
          from prospect_activity a
          left join team_members atm on atm.id = a.logged_by_team_member_id
          where a.prospect_id = p.id
        ),
        '[]'
      ) as activity,
      coalesce(
        (
          select json_agg(
            json_build_object(
              'id', fu.id, 'clientId', fu.client_id, 'leadId', fu.lead_id, 'partnerId', fu.partner_id, 'prospectId', fu.prospect_id,
              'label', fu.label, 'date', fu.date, 'status', fu.status, 'createdAt', fu.created_at, 'updatedAt', fu.updated_at,
              'assignedToTeamMemberId', fu.assigned_to_team_member_id
            )
            order by fu.date asc
          )
          from follow_ups fu
          where fu.prospect_id = p.id
        ),
        '[]'
      ) as follow_ups
    from prospects p
    left join team_members tm on tm.id = p.owner_team_member_id
    left join (
      select prospect_id, min(date) as next_date
      from follow_ups
      where status = 'UPCOMING' and business_id = ${businessId} and prospect_id is not null
      group by prospect_id
    ) f on f.prospect_id = p.id
    where p.business_id = ${businessId}
      and (${filters.status ?? null}::text is null or p.status = ${filters.status ?? null})
      and (${filters.industry ?? null}::text is null or lower(p.industry) = lower(${filters.industry ?? null}))
      and (
        (${ownerIds}::uuid[] is null and not ${includeUnassignedOwner})
        or (${ownerIds}::uuid[] is not null and p.owner_team_member_id = any(${ownerIds}::uuid[]))
        or (${includeUnassignedOwner} and p.owner_team_member_id is null)
      )
      and (
        ${searchPattern}::text is null
        or p.name ilike ${searchPattern}
        or p.business_name ilike ${searchPattern}
        or p.email ilike ${searchPattern}
      )
      and (${filters.converted === "include"} or p.status <> 'CONVERTED')
    order by
      case when p.hot then 0 else 1 end asc,
      case when ${sort} = 'next_follow_up' and f.next_date is null then 1 else 0 end asc,
      case when ${sort} = 'next_follow_up' then f.next_date end asc,
      case when ${sort} = 'name' then p.name end asc,
      case when ${sort} = 'owner' then tm.name end asc nulls last,
      case when ${sort} = 'industry' then p.industry end asc nulls last,
      case when ${sort} = 'created' then p.created_at end desc,
      p.created_at desc
  `;
  return rows.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      ...mapProspect(r),
      activity: r.activity as ProspectActivity[],
      followUps: r.follow_ups as FollowUp[],
      nextFollowUpDate: r.next_follow_up_date as string | null,
    };
  });
}

/** Prospects already converted to a lead — hidden from the main prospects list by default, surfaced only via the Converted drawer. */
export async function listConvertedProspects(businessId: string): Promise<Prospect[]> {
  const rows = await sql`
    select p.*, tm.name as owner_name, tm.color as owner_color
    from prospects p
    left join team_members tm on tm.id = p.owner_team_member_id
    where p.business_id = ${businessId} and p.status = 'CONVERTED'
    order by p.updated_at desc
  `;
  return rows.map((row) => mapProspect(row as Record<string, unknown>));
}

/** Distinct industries already in use — populates the Industry filter dropdown without a separate managed lookup table. */
export async function listDistinctIndustries(businessId: string): Promise<string[]> {
  const rows = await sql`
    select distinct industry from prospects
    where business_id = ${businessId} and industry is not null and industry <> ''
    order by industry asc
  `;
  return rows.map((r) => (r as Record<string, unknown>).industry as string);
}

/** Whether `prospectId` belongs to `businessId` — the tenant-isolation check for prospect-scoped actions; prospects have no per-team-member access-list concept, like leads. */
export async function prospectBelongsToBusiness(prospectId: string, businessId: string): Promise<boolean> {
  const rows = await sql`select 1 from prospects where id = ${prospectId} and business_id = ${businessId}`;
  return rows.length > 0;
}

export interface ProspectInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  businessName?: string | null;
  title?: string | null;
  industry?: string | null;
  status: ProspectStatus;
  notes?: string | null;
  ownerTeamMemberId?: string | null;
}

export async function createProspect(businessId: string, input: ProspectInput): Promise<Prospect> {
  const rows = await sql`
    insert into prospects (business_id, name, email, phone, business_name, title, industry, status, notes, owner_team_member_id)
    values (
      ${businessId}, ${input.name}, ${input.email ?? null}, ${input.phone ?? null}, ${input.businessName ?? null},
      ${input.title ?? null}, ${input.industry ?? null}, ${input.status}, ${input.notes ?? null}, ${input.ownerTeamMemberId ?? null}
    )
    returning *
  `;
  return mapProspect(rows[0] as Record<string, unknown>);
}

export async function updateProspect(id: string, businessId: string, input: ProspectInput): Promise<void> {
  await sql`
    update prospects set
      name = ${input.name},
      email = ${input.email ?? null},
      phone = ${input.phone ?? null},
      business_name = ${input.businessName ?? null},
      title = ${input.title ?? null},
      industry = ${input.industry ?? null},
      status = ${input.status},
      notes = ${input.notes ?? null},
      owner_team_member_id = ${input.ownerTeamMemberId ?? null},
      updated_at = now()
    where id = ${id} and business_id = ${businessId}
  `;
}

export async function deleteProspect(id: string, businessId: string): Promise<void> {
  await sql`delete from prospects where id = ${id} and business_id = ${businessId}`;
}

export async function setProspectHot(id: string, businessId: string, hot: boolean): Promise<void> {
  await sql`update prospects set hot = ${hot}, updated_at = now() where id = ${id} and business_id = ${businessId}`;
}

export async function addProspectActivity(
  prospectId: string,
  businessId: string,
  input: { type: ProspectActivityType; body: string },
  loggedByTeamMemberId: string | null
): Promise<void> {
  await sql`
    insert into prospect_activity (business_id, prospect_id, type, body, logged_by_team_member_id)
    values (${businessId}, ${prospectId}, ${input.type}, ${input.body}, ${loggedByTeamMemberId})
  `;
}

/** Backdates/corrects when an activity entry happened — created_at doubles as that date since nothing else in the app treats it as tamper-proof audit metadata (unlike e.g. invoices), so there's no separate "occurred on" column to keep in sync. */
export async function updateProspectActivityDate(id: string, businessId: string, date: string): Promise<void> {
  await sql`
    update prospect_activity set created_at = ${date}
    where id = ${id} and business_id = ${businessId}
  `;
}

/**
 * Creates a Lead from a prospect's current data, copies its activity log
 * in as lead notes (each prefixed with its type, so the history isn't
 * lost), and marks the prospect CONVERTED — mirrors convertLeadToClient's
 * carry-over approach one funnel stage earlier.
 */
export async function convertProspectToLead(prospectId: string, businessId: string): Promise<string> {
  const rows = await sql`select * from prospects where id = ${prospectId} and business_id = ${businessId}`;
  if (rows.length === 0) throw new Error("Prospect not found");
  const prospect = mapProspect(rows[0] as Record<string, unknown>);

  const lead = await createLead(businessId, {
    companyName: prospect.businessName || prospect.name,
    contactName: prospect.name,
    contactEmail: prospect.email,
    contactPhone: prospect.phone,
    status: "NEW",
    leadOwnerTeamMemberId: prospect.ownerTeamMemberId,
  });

  await sql`
    update prospects set status = 'CONVERTED', converted_lead_id = ${lead.id}, converted_at = now(), updated_at = now()
    where id = ${prospectId} and business_id = ${businessId}
  `;

  const activity = await sql`
    select type, body, created_at, logged_by_team_member_id from prospect_activity
    where prospect_id = ${prospectId} and business_id = ${businessId}
    order by created_at asc
  `;
  for (const entry of activity) {
    const a = entry as Record<string, unknown>;
    await sql`
      insert into lead_notes (lead_id, business_id, body, created_at, author_team_member_id)
      values (${lead.id}, ${businessId}, ${`[${a.type}] ${a.body as string}`}, ${a.created_at as string}, ${a.logged_by_team_member_id as string | null})
    `;
  }

  return lead.id;
}
