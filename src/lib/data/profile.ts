import { sql } from "@/lib/db";
import { todayInTimezone } from "@/lib/timezone";
import type { Profile } from "@/lib/types";

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    name: row.name as string,
    email: row.email as string,
    timezone: row.timezone as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getProfile(): Promise<Profile> {
  const rows = await sql`select * from profile where id = true`;
  return mapProfile(rows[0] as Record<string, unknown>);
}

/** The operator's configured IANA timezone, used to compute "today" everywhere date-only logic needs it. */
export async function getTimezone(): Promise<string> {
  const rows = await sql`select timezone from profile where id = true`;
  return (rows[0] as Record<string, unknown>)?.timezone as string;
}

/** "Today" as a YYYY-MM-DD string in the operator's configured timezone — the standard entry point for server pages/actions that just need the current calendar day. */
export async function getToday(): Promise<string> {
  return todayInTimezone(await getTimezone());
}

export async function updateProfile(input: { name: string; email: string; timezone: string }): Promise<void> {
  await sql`
    update profile set name = ${input.name}, email = ${input.email}, timezone = ${input.timezone}, updated_at = now()
    where id = true
  `;
}
