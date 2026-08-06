import { sql } from "@/lib/db";
import { listFollowUpsForPartner } from "@/lib/data/followups";
import { listMeetingNotes } from "@/lib/data/meetingnotes";
import { listDocumentsForPartner } from "@/lib/data/documents";
import type { CommissionStatus, EntityColor, Lead, Partner, PartnerCommission, PartnerWithRelations } from "@/lib/types";

function mapPartner(row: Record<string, unknown>): Partner {
  return {
    id: row.id as string,
    companyName: row.company_name as string,
    contactName: row.contact_name as string | null,
    contactEmail: row.contact_email as string | null,
    contactPhone: row.contact_phone as string | null,
    commissionTerms: row.commission_terms as string | null,
    active: row.active as boolean,
    color: row.color as EntityColor | null,
    notes: row.notes as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapCommission(row: Record<string, unknown>): PartnerCommission {
  return {
    id: row.id as string,
    partnerId: row.partner_id as string,
    referredLeadId: row.referred_lead_id as string | null,
    referredClientId: row.referred_client_id as string | null,
    amount: row.amount as string,
    status: row.status as CommissionStatus,
    description: row.description as string | null,
    dueDate: row.due_date as string | null,
    paidDate: row.paid_date as string | null,
    createdAt: row.created_at as string,
  };
}

export interface PartnerSummary extends Partner {
  referralCount: number;
  amountOwed: number;
  /** Lifetime invoiced + paid revenue from clients this partner's WON referrals converted into — see PartnerWithRelations.revenueGenerated for why this is tracked separately from commissions owed. */
  revenueGenerated: number;
}

/** All partners with their referral count, total amount currently owed, and revenue generated, for the list page. Revenue is pre-aggregated in its own CTE rather than joined directly — joining invoices alongside the leads/commissions joins already in this query would fan out and double-count. */
export async function listPartners(businessId: string, opts: { includeInactive?: boolean } = {}): Promise<PartnerSummary[]> {
  const rows = await sql`
    with revenue_by_partner as (
      select l.referred_by_partner_id as partner_id, coalesce(sum(i.amount), 0) as revenue
      from leads l
      join invoices i on i.client_id = l.converted_client_id
      where l.business_id = ${businessId} and l.referred_by_partner_id is not null
        and l.status = 'WON' and i.status <> 'NOT_INVOICED'
      group by l.referred_by_partner_id
    )
    select p.*,
      count(distinct l.id) as referral_count,
      coalesce(sum(pc.amount) filter (where pc.status = 'OWED'), 0) as amount_owed,
      coalesce(rbp.revenue, 0) as revenue_generated
    from partners p
    left join leads l on l.referred_by_partner_id = p.id
    left join partner_commissions pc on pc.partner_id = p.id
    left join revenue_by_partner rbp on rbp.partner_id = p.id
    where p.business_id = ${businessId}
      and (${opts.includeInactive ?? false} or p.active)
    group by p.id, rbp.revenue
    order by p.active desc, p.company_name asc
  `;
  return rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      ...mapPartner(row),
      referralCount: Number(row.referral_count),
      amountOwed: Number(row.amount_owed),
      revenueGenerated: Number(row.revenue_generated),
    };
  });
}

export async function getPartner(id: string, businessId: string): Promise<PartnerWithRelations | null> {
  const [partnerRows, referredLeads, followUps, meetingNotes, documents, commissionRows, revenueRows] = await Promise.all([
    sql`select * from partners where id = ${id} and business_id = ${businessId}`,
    listReferredLeads(id, businessId),
    listFollowUpsForPartner(id, businessId),
    listMeetingNotes(businessId, { partnerId: id }),
    listDocumentsForPartner(id, businessId),
    sql`select * from partner_commissions where partner_id = ${id} and business_id = ${businessId} order by created_at desc`,
    sql`
      select coalesce(sum(i.amount), 0) as revenue
      from leads l
      join invoices i on i.client_id = l.converted_client_id
      where l.referred_by_partner_id = ${id} and l.business_id = ${businessId}
        and l.status = 'WON' and i.status <> 'NOT_INVOICED'
    `,
  ]);
  if (partnerRows.length === 0) return null;
  return {
    ...mapPartner(partnerRows[0] as Record<string, unknown>),
    referredLeads,
    followUps,
    meetingNotes,
    documents,
    commissions: commissionRows.map((r) => mapCommission(r as Record<string, unknown>)),
    revenueGenerated: Number((revenueRows[0] as Record<string, unknown>).revenue),
  };
}

/** Leads referred by this partner, in the same pipeline shape as the Leads page — reuses the existing lead schema instead of a parallel referral list. */
export async function listReferredLeads(partnerId: string, businessId: string): Promise<Lead[]> {
  const rows = await sql`
    select l.*, wt.name as work_type_name, ls.name as source_name
    from leads l
    left join work_types wt on wt.id = l.work_type_id
    left join lead_sources ls on ls.id = l.source_id
    where l.referred_by_partner_id = ${partnerId} and l.business_id = ${businessId}
    order by l.created_at desc
  `;
  return rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: row.id as string,
      companyName: row.company_name as string,
      contactName: row.contact_name as string | null,
      contactEmail: row.contact_email as string | null,
      contactPhone: row.contact_phone as string | null,
      status: row.status as Lead["status"],
      estimatedValue: row.estimated_value as string | null,
      workTypeId: row.work_type_id as string | null,
      workTypeName: (row.work_type_name as string | null) ?? null,
      workTypeOther: row.work_type_other as string | null,
      sourceId: row.source_id as string | null,
      sourceName: (row.source_name as string | null) ?? null,
      sourceOther: row.source_other as string | null,
      color: row.color as EntityColor | null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      convertedClientId: row.converted_client_id as string | null,
      leadOwnerTeamMemberId: (row.lead_owner_team_member_id as string | null) ?? null,
      leadOwnerName: null,
      leadOwnerColor: null,
      referredByPartnerId: row.referred_by_partner_id as string | null,
      referredByPartnerName: null,
      referredByPartnerColor: null,
      hot: row.hot as boolean,
    };
  });
}

export interface PartnerInput {
  companyName: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  commissionTerms?: string | null;
  notes?: string | null;
  color?: EntityColor | null;
}

export async function createPartner(businessId: string, input: PartnerInput): Promise<Partner> {
  const rows = await sql`
    insert into partners (business_id, company_name, contact_name, contact_email, contact_phone, commission_terms, notes, color)
    values (
      ${businessId}, ${input.companyName}, ${input.contactName ?? null}, ${input.contactEmail ?? null}, ${input.contactPhone ?? null},
      ${input.commissionTerms ?? null}, ${input.notes ?? null}, ${input.color ?? null}
    )
    returning *
  `;
  return mapPartner(rows[0] as Record<string, unknown>);
}

export async function updatePartner(id: string, businessId: string, input: PartnerInput): Promise<void> {
  await sql`
    update partners set
      company_name = ${input.companyName},
      contact_name = ${input.contactName ?? null},
      contact_email = ${input.contactEmail ?? null},
      contact_phone = ${input.contactPhone ?? null},
      commission_terms = ${input.commissionTerms ?? null},
      notes = ${input.notes ?? null},
      color = ${input.color ?? null},
      updated_at = now()
    where id = ${id} and business_id = ${businessId}
  `;
}

export async function setPartnerColor(id: string, businessId: string, color: EntityColor | null): Promise<void> {
  await sql`update partners set color = ${color}, updated_at = now() where id = ${id} and business_id = ${businessId}`;
}

export async function setPartnerActive(id: string, businessId: string, active: boolean): Promise<void> {
  await sql`update partners set active = ${active}, updated_at = now() where id = ${id} and business_id = ${businessId}`;
}

/** Whether it's safe to hard-delete: no referrals and no commission history to lose. Callers should fall back to setPartnerActive(false) (archive) when this is false. */
export async function partnerHasHistory(id: string, businessId: string): Promise<boolean> {
  const rows = await sql`
    select
      exists(select 1 from leads where referred_by_partner_id = ${id} and business_id = ${businessId}) as has_referrals,
      exists(select 1 from partner_commissions where partner_id = ${id} and business_id = ${businessId}) as has_commissions
  `;
  const row = rows[0] as Record<string, unknown>;
  return Boolean(row.has_referrals) || Boolean(row.has_commissions);
}

export async function deletePartner(id: string, businessId: string): Promise<void> {
  await sql`delete from partners where id = ${id} and business_id = ${businessId}`;
}

export interface CommissionInput {
  referredLeadId?: string | null;
  referredClientId?: string | null;
  amount: number;
  status: CommissionStatus;
  description?: string | null;
  dueDate?: string | null;
  paidDate?: string | null;
}

export async function createCommission(partnerId: string, businessId: string, input: CommissionInput): Promise<PartnerCommission> {
  const rows = await sql`
    insert into partner_commissions (business_id, partner_id, referred_lead_id, referred_client_id, amount, status, description, due_date, paid_date)
    values (
      ${businessId}, ${partnerId}, ${input.referredLeadId ?? null}, ${input.referredClientId ?? null},
      ${input.amount}, ${input.status}, ${input.description ?? null}, ${input.dueDate ?? null}, ${input.paidDate ?? null}
    )
    returning *
  `;
  return mapCommission(rows[0] as Record<string, unknown>);
}

export async function updateCommission(id: string, businessId: string, input: CommissionInput): Promise<void> {
  await sql`
    update partner_commissions set
      referred_lead_id = ${input.referredLeadId ?? null},
      referred_client_id = ${input.referredClientId ?? null},
      amount = ${input.amount},
      status = ${input.status},
      description = ${input.description ?? null},
      due_date = ${input.dueDate ?? null},
      paid_date = ${input.paidDate ?? null},
      updated_at = now()
    where id = ${id} and business_id = ${businessId}
  `;
}

export async function markCommissionPaid(id: string, businessId: string, paidDate: string): Promise<void> {
  await sql`
    update partner_commissions set status = 'PAID', paid_date = ${paidDate}, updated_at = now()
    where id = ${id} and business_id = ${businessId}
  `;
}

export async function deleteCommission(id: string, businessId: string): Promise<void> {
  await sql`delete from partner_commissions where id = ${id} and business_id = ${businessId}`;
}

/** Cheap lookup used by the action layer's ownership checks — mirrors leadBelongsToBusiness. */
export async function partnerBelongsToBusiness(id: string, businessId: string): Promise<boolean> {
  const rows = await sql`select 1 from partners where id = ${id} and business_id = ${businessId}`;
  return rows.length > 0;
}
