import { sql } from "@/lib/db";
import type { BusinessEntity } from "@/lib/types";

function mapBusinessEntity(row: Record<string, unknown>): BusinessEntity {
  return {
    id: row.id as string,
    name: row.name as string,
    address: row.address as string | null,
    contactInfo: row.contact_info as string | null,
    active: row.active as boolean,
    createdAt: row.created_at as string,
  };
}

export async function listBusinessEntities(opts: { includeInactive?: boolean } = {}): Promise<BusinessEntity[]> {
  const rows = opts.includeInactive
    ? await sql`select * from business_entities order by active desc, name asc`
    : await sql`select * from business_entities where active order by name asc`;
  return rows.map((r) => mapBusinessEntity(r as Record<string, unknown>));
}

export interface BusinessEntityInput {
  name: string;
  address: string | null;
  contactInfo: string | null;
}

export async function createBusinessEntity(input: BusinessEntityInput): Promise<BusinessEntity> {
  const rows = await sql`
    insert into business_entities (name, address, contact_info)
    values (${input.name}, ${input.address}, ${input.contactInfo})
    returning *
  `;
  return mapBusinessEntity(rows[0] as Record<string, unknown>);
}

export async function updateBusinessEntity(id: string, input: BusinessEntityInput): Promise<void> {
  await sql`
    update business_entities set name = ${input.name}, address = ${input.address}, contact_info = ${input.contactInfo}
    where id = ${id}
  `;
}

export async function setBusinessEntityActive(id: string, active: boolean): Promise<void> {
  await sql`update business_entities set active = ${active} where id = ${id}`;
}
