import { sql } from "@/lib/db";
import type { BillingEntity } from "@/lib/types";

function mapBillingEntity(row: Record<string, unknown>): BillingEntity {
  return {
    id: row.id as string,
    name: row.name as string,
    address: row.address as string | null,
    contactInfo: row.contact_info as string | null,
    active: row.active as boolean,
    createdAt: row.created_at as string,
  };
}

export async function listBillingEntities(businessId: string, opts: { includeInactive?: boolean } = {}): Promise<BillingEntity[]> {
  const rows = opts.includeInactive
    ? await sql`select * from billing_entities where business_id = ${businessId} order by active desc, name asc`
    : await sql`select * from billing_entities where business_id = ${businessId} and active order by name asc`;
  return rows.map((r) => mapBillingEntity(r as Record<string, unknown>));
}

export interface BillingEntityInput {
  name: string;
  address: string | null;
  contactInfo: string | null;
}

export async function createBillingEntity(businessId: string, input: BillingEntityInput): Promise<BillingEntity> {
  const rows = await sql`
    insert into billing_entities (business_id, name, address, contact_info)
    values (${businessId}, ${input.name}, ${input.address}, ${input.contactInfo})
    returning *
  `;
  return mapBillingEntity(rows[0] as Record<string, unknown>);
}

export async function updateBillingEntity(id: string, businessId: string, input: BillingEntityInput): Promise<void> {
  await sql`
    update billing_entities set name = ${input.name}, address = ${input.address}, contact_info = ${input.contactInfo}
    where id = ${id} and business_id = ${businessId}
  `;
}

export async function setBillingEntityActive(id: string, businessId: string, active: boolean): Promise<void> {
  await sql`update billing_entities set active = ${active} where id = ${id} and business_id = ${businessId}`;
}
