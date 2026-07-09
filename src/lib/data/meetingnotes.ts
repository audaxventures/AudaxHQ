import { sql } from "@/lib/db";
import type { EntityColor, MeetingActionItemTask, MeetingNote } from "@/lib/types";

interface MeetingNoteRow {
  id: string;
  title: string | null;
  client_id: string | null;
  lead_id: string | null;
  meeting_date: string;
  attendees: string | null;
  agenda: string | null;
  notes: string | null;
  action_items: string | null;
  created_at: string;
  owner_name?: string;
  owner_color?: EntityColor | null;
  action_item_tasks?: MeetingActionItemTask[] | null;
}

function mapMeetingNote(row: MeetingNoteRow): MeetingNote {
  return {
    id: row.id,
    title: row.title,
    clientId: row.client_id,
    leadId: row.lead_id,
    meetingDate: row.meeting_date,
    attendees: row.attendees,
    agenda: row.agenda,
    notes: row.notes,
    actionItems: row.action_items,
    createdAt: row.created_at,
    ownerName: row.owner_name,
    ownerColor: row.owner_color,
    actionItemTasks: row.action_item_tasks ?? [],
  };
}

export interface MeetingNoteFilters {
  clientId?: string;
  leadId?: string;
  /** Team-member scoping: restrict client-owned notes to this list — lead-owned notes are always included, since leads aren't access-scoped. Undefined/null = no restriction (owner). */
  accessibleClientIds?: string[] | null;
}

export async function listMeetingNotes(businessId: string, filters: MeetingNoteFilters = {}): Promise<MeetingNote[]> {
  const rows = await sql`
    select
      m.id, m.title, m.client_id, m.lead_id, m.meeting_date, m.attendees, m.agenda, m.notes, m.action_items, m.created_at,
      coalesce(c.company_name, l.company_name) as owner_name,
      coalesce(c.color, l.color) as owner_color,
      coalesce(
        (
          select json_agg(json_build_object('id', t.id, 'title', t.title, 'status', t.status, 'dueDate', t.due_date) order by t.created_at asc)
          from todos t
          where t.meeting_note_id = m.id
        ),
        '[]'
      ) as action_item_tasks
    from meeting_notes m
    left join clients c on c.id = m.client_id
    left join leads l on l.id = m.lead_id
    where m.business_id = ${businessId}
      and (${filters.clientId ?? null}::uuid is null or m.client_id = ${filters.clientId ?? null})
      and (${filters.leadId ?? null}::uuid is null or m.lead_id = ${filters.leadId ?? null})
      and (
        ${filters.accessibleClientIds ?? null}::uuid[] is null
        or m.client_id is null
        or m.client_id = any(${filters.accessibleClientIds ?? null}::uuid[])
      )
    order by m.meeting_date desc, m.created_at desc
  `;
  return (rows as unknown as MeetingNoteRow[]).map(mapMeetingNote);
}

export interface CreateMeetingNoteInput {
  title?: string | null;
  clientId?: string;
  leadId?: string;
  meetingDate: string;
  attendees?: string | null;
  agenda?: string | null;
  notes?: string | null;
}

export async function createMeetingNote(businessId: string, input: CreateMeetingNoteInput): Promise<string> {
  const rows = await sql`
    insert into meeting_notes (title, client_id, lead_id, business_id, meeting_date, attendees, agenda, notes)
    values (
      ${input.title ?? null}, ${input.clientId ?? null}, ${input.leadId ?? null}, ${businessId}, ${input.meetingDate}, ${input.attendees ?? null},
      ${input.agenda ?? null}, ${input.notes ?? null}
    )
    returning id
  `;
  return (rows[0] as Record<string, unknown>).id as string;
}

export interface UpdateMeetingNoteInput {
  title?: string | null;
  meetingDate: string;
  attendees?: string | null;
  agenda?: string | null;
  notes?: string | null;
}

/**
 * Deliberately never touches action_items — that column is legacy free-text
 * (from before the quick-add-to-do UI existed) and is now read-only display
 * data. Not including it in the SET clause here is what keeps existing
 * legacy content from being wiped out the first time an old note is edited.
 */
export async function updateMeetingNote(id: string, businessId: string, input: UpdateMeetingNoteInput): Promise<void> {
  await sql`
    update meeting_notes
    set title = ${input.title ?? null}, meeting_date = ${input.meetingDate}, attendees = ${input.attendees ?? null},
      agenda = ${input.agenda ?? null}, notes = ${input.notes ?? null}
    where id = ${id} and business_id = ${businessId}
  `;
}

export async function deleteMeetingNote(id: string, businessId: string): Promise<void> {
  await sql`delete from meeting_notes where id = ${id} and business_id = ${businessId}`;
}
