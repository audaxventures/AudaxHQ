import { sql } from "@/lib/db";
import type { EntityColor, MeetingNote } from "@/lib/types";

interface MeetingNoteRow {
  id: string;
  client_id: string | null;
  lead_id: string | null;
  meeting_date: string;
  attendees: string | null;
  notes: string;
  created_at: string;
  owner_name?: string;
  owner_color?: EntityColor | null;
}

function mapMeetingNote(row: MeetingNoteRow): MeetingNote {
  return {
    id: row.id,
    clientId: row.client_id,
    leadId: row.lead_id,
    meetingDate: row.meeting_date,
    attendees: row.attendees,
    notes: row.notes,
    createdAt: row.created_at,
    ownerName: row.owner_name,
    ownerColor: row.owner_color,
  };
}

export interface MeetingNoteFilters {
  clientId?: string;
  leadId?: string;
}

export async function listMeetingNotes(filters: MeetingNoteFilters = {}): Promise<MeetingNote[]> {
  const rows = await sql`
    select
      m.id, m.client_id, m.lead_id, m.meeting_date, m.attendees, m.notes, m.created_at,
      coalesce(c.company_name, l.company_name) as owner_name,
      coalesce(c.color, l.color) as owner_color
    from meeting_notes m
    left join clients c on c.id = m.client_id
    left join leads l on l.id = m.lead_id
    where (${filters.clientId ?? null}::uuid is null or m.client_id = ${filters.clientId ?? null})
      and (${filters.leadId ?? null}::uuid is null or m.lead_id = ${filters.leadId ?? null})
    order by m.meeting_date desc, m.created_at desc
  `;
  return (rows as unknown as MeetingNoteRow[]).map(mapMeetingNote);
}

export interface CreateMeetingNoteInput {
  clientId?: string;
  leadId?: string;
  meetingDate: string;
  attendees?: string | null;
  notes: string;
}

export async function createMeetingNote(input: CreateMeetingNoteInput): Promise<void> {
  await sql`
    insert into meeting_notes (client_id, lead_id, meeting_date, attendees, notes)
    values (${input.clientId ?? null}, ${input.leadId ?? null}, ${input.meetingDate}, ${input.attendees ?? null}, ${input.notes})
  `;
}

export interface UpdateMeetingNoteInput {
  meetingDate: string;
  attendees?: string | null;
  notes: string;
}

export async function updateMeetingNote(id: string, input: UpdateMeetingNoteInput): Promise<void> {
  await sql`
    update meeting_notes
    set meeting_date = ${input.meetingDate}, attendees = ${input.attendees ?? null}, notes = ${input.notes}
    where id = ${id}
  `;
}

export async function deleteMeetingNote(id: string): Promise<void> {
  await sql`delete from meeting_notes where id = ${id}`;
}
