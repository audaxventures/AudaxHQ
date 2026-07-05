import { sql } from "@/lib/db";
import type { Profile } from "@/lib/types";

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    name: row.name as string,
    email: row.email as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getProfile(): Promise<Profile> {
  const rows = await sql`select * from profile where id = true`;
  return mapProfile(rows[0] as Record<string, unknown>);
}

export async function updateProfile(input: { name: string; email: string }): Promise<void> {
  await sql`
    update profile set name = ${input.name}, email = ${input.email}, updated_at = now()
    where id = true
  `;
}
