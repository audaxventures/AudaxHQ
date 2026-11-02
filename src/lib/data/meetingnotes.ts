import { sql } from "@/lib/db";
import { accessibleClientIdsFor } from "@/lib/data/clientAccess";
import type { CurrentUser, EntityColor, MeetingActionItemTask, MeetingNote, NoteFolder } from "@/lib/types";

interface MeetingNoteRow {
  id: string;
  title: string | null;
  client_id: string | null;
  lead_id: string | null;
  partner_id: string | null;
  meeting_date: string;
  start_time: string | null;
  timezone: string | null;
  duration_minutes: number | null;
  location: string | null;
  attendees: string | null;
  agenda: string | null;
  notes: string | null;
  action_items: string | null;
  created_at: string;
  owner_name?: string;
  owner_color?: EntityColor | null;
  owner_email?: string | null;
  owner_contact_name?: string | null;
  action_item_tasks?: MeetingActionItemTask[] | null;
  last_emailed_to: string | null;
  last_emailed_at: string | null;
  folder_id?: string | null;
  tags?: string[] | null;
}

function mapMeetingNote(row: MeetingNoteRow): MeetingNote {
  return {
    id: row.id,
    title: row.title,
    clientId: row.client_id,
    leadId: row.lead_id,
    partnerId: row.partner_id,
    meetingDate: row.meeting_date,
    startTime: row.start_time,
    timezone: row.timezone,
    durationMinutes: row.duration_minutes,
    location: row.location,
    attendees: row.attendees,
    agenda: row.agenda,
    notes: row.notes,
    actionItems: row.action_items,
    createdAt: row.created_at,
    ownerName: row.owner_name,
    ownerColor: row.owner_color,
    ownerEmail: row.owner_email,
    ownerContactName: row.owner_contact_name,
    actionItemTasks: row.action_item_tasks ?? [],
    lastEmailedTo: row.last_emailed_to,
    lastEmailedAt: row.last_emailed_at,
    isPrivate: !row.client_id && !row.lead_id && !row.partner_id,
    folderId: row.folder_id ?? null,
    tags: row.tags ?? [],
  };
}

/**
 * Who is looking at notes — decides which notes are visible and whose
 * folders/tags come back with them (folders and tags are personal, see
 * migration 052). teamMemberId null = the workspace owner.
 */
export interface NoteViewer {
  teamMemberId: string | null;
  /** Client access list — null = unrestricted (owner, or a tier without per-client access). */
  accessibleClientIds: string[] | null;
  /** Owner, or a team member granted Partners access — mirrors requirePartnerAccess. */
  canSeePartners: boolean;
}

export async function noteViewerFor(user: CurrentUser): Promise<NoteViewer> {
  return {
    teamMemberId: user.role === "TEAM_MEMBER" ? user.teamMember.id : null,
    accessibleClientIds: await accessibleClientIdsFor(user),
    canSeePartners: user.role === "OWNER" || user.teamMember.hasPartnersAccess,
  };
}

export interface MeetingNoteFilters {
  /** A single note by id — used by getMeetingNoteById. */
  id?: string;
  clientId?: string;
  leadId?: string;
  partnerId?: string;
  /**
   * Partner-owned notes are excluded unless partnerId is set to that exact
   * partner — pass true to include them alongside client/lead-owned notes
   * too, e.g. for the global Notes list. Only ever set this from
   * NoteViewer.canSeePartners.
   */
  includePartnerOwned?: boolean;
  /** Team-member scoping: restrict client-owned notes to this list — lead-owned notes are always included, since leads aren't access-scoped. Undefined/null = no restriction (owner). */
  accessibleClientIds?: string[] | null;
  /**
   * Who's looking. Private notes (no client/lead/partner) are only ever
   * returned when this is set, and then only the viewer's own. Also brings
   * back the viewer's own folder and tags for each note. Leave unset on
   * client/lead/partner pages — those never show private notes.
   */
  viewer?: NoteViewer;
}

export async function listMeetingNotes(businessId: string, filters: MeetingNoteFilters = {}): Promise<MeetingNote[]> {
  const hasViewer = !!filters.viewer;
  const viewerTm = filters.viewer?.teamMemberId ?? null;
  const rows = await sql`
    select
      m.id, m.title, m.client_id, m.lead_id, m.partner_id, m.meeting_date, m.start_time, m.timezone, m.duration_minutes, m.location,
      m.attendees, m.agenda, m.notes, m.action_items, m.created_at, m.last_emailed_to, m.last_emailed_at,
      coalesce(c.company_name, l.company_name, p.company_name) as owner_name,
      coalesce(c.color, l.color, p.color) as owner_color,
      coalesce(c.contact_email, l.contact_email, p.contact_email) as owner_email,
      coalesce(c.contact_name, l.contact_name, p.contact_name) as owner_contact_name,
      coalesce(
        (
          select json_agg(
            json_build_object(
              'id', t.id, 'title', t.title, 'status', t.status, 'dueDate', t.due_date, 'ownedBy', t.owned_by,
              'assigneeName', coalesce(tm.name, b.owner_name)
            )
            order by t.created_at asc
          )
          from todos t
          left join team_members tm on tm.id = t.assigned_to_team_member_id
          where t.meeting_note_id = m.id
        ),
        '[]'
      ) as action_item_tasks,
      case when ${hasViewer}::boolean then (
        select fi.folder_id from note_folder_items fi
        where fi.meeting_note_id = m.id and fi.team_member_id is not distinct from ${viewerTm}::uuid
        limit 1
      ) end as folder_id,
      case when ${hasViewer}::boolean then coalesce((
        select array_agg(nt.name order by nt.name)
        from meeting_note_tags mt
        join note_tags nt on nt.id = mt.tag_id
        where mt.meeting_note_id = m.id and nt.team_member_id is not distinct from ${viewerTm}::uuid
      ), '{}') end as tags
    from meeting_notes m
    left join clients c on c.id = m.client_id
    left join leads l on l.id = m.lead_id
    left join partners p on p.id = m.partner_id
    left join businesses b on b.id = m.business_id
    where m.business_id = ${businessId}
      and (${filters.id ?? null}::uuid is null or m.id = ${filters.id ?? null})
      and (${filters.clientId ?? null}::uuid is null or m.client_id = ${filters.clientId ?? null})
      and (${filters.leadId ?? null}::uuid is null or m.lead_id = ${filters.leadId ?? null})
      and (
        ${filters.includePartnerOwned ?? false}::boolean
        or (${filters.partnerId ?? null}::uuid is not null and m.partner_id = ${filters.partnerId ?? null})
        or (${filters.partnerId ?? null}::uuid is null and m.partner_id is null)
      )
      and (
        ${filters.accessibleClientIds ?? null}::uuid[] is null
        or m.client_id is null
        or m.client_id = any(${filters.accessibleClientIds ?? null}::uuid[])
      )
      and (
        m.client_id is not null or m.lead_id is not null or m.partner_id is not null
        or (${hasViewer}::boolean and m.author_team_member_id is not distinct from ${viewerTm}::uuid)
      )
    order by m.meeting_date desc, m.created_at desc
  `;
  return (rows as unknown as MeetingNoteRow[]).map(mapMeetingNote);
}

/**
 * A single note, visible to this viewer under the same rules as the Notes
 * list — used by the PDF route, the email action, and edit/delete
 * authorization. Null if not found or not visible.
 */
export async function getMeetingNoteById(id: string, businessId: string, viewer: NoteViewer): Promise<MeetingNote | null> {
  const [note] = await listMeetingNotes(businessId, {
    id,
    viewer,
    accessibleClientIds: viewer.accessibleClientIds,
    includePartnerOwned: viewer.canSeePartners,
  });
  return note ?? null;
}

/** Stamps a note with who it was most recently emailed to — see migration 033. Only the latest send is tracked. */
export async function recordMeetingNoteEmailSent(id: string, businessId: string, sentTo: string): Promise<void> {
  await sql`
    update meeting_notes
    set last_emailed_to = ${sentTo}, last_emailed_at = now()
    where id = ${id} and business_id = ${businessId}
  `;
}

export interface CreateMeetingNoteInput {
  title?: string | null;
  clientId?: string;
  leadId?: string;
  partnerId?: string;
  meetingDate: string;
  startTime?: string | null;
  timezone?: string | null;
  durationMinutes?: number | null;
  location?: string | null;
  attendees?: string | null;
  agenda?: string | null;
  notes?: string | null;
  /** Private notes only (no client/lead/partner): the author's team member id, null for the workspace owner. */
  authorTeamMemberId?: string | null;
}

export async function createMeetingNote(businessId: string, input: CreateMeetingNoteInput): Promise<string> {
  const rows = await sql`
    insert into meeting_notes (
      title, client_id, lead_id, partner_id, business_id, meeting_date, start_time, timezone, duration_minutes, location, attendees, agenda, notes,
      author_team_member_id
    )
    values (
      ${input.title ?? null}, ${input.clientId ?? null}, ${input.leadId ?? null}, ${input.partnerId ?? null}, ${businessId}, ${input.meetingDate},
      ${input.startTime ?? null}, ${input.timezone ?? null}, ${input.durationMinutes ?? null}, ${input.location ?? null}, ${input.attendees ?? null},
      ${input.agenda ?? null}, ${input.notes ?? null}, ${input.authorTeamMemberId ?? null}
    )
    returning id
  `;
  return (rows[0] as Record<string, unknown>).id as string;
}

export interface UpdateMeetingNoteInput {
  title?: string | null;
  meetingDate: string;
  startTime?: string | null;
  timezone?: string | null;
  durationMinutes?: number | null;
  location?: string | null;
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
    set title = ${input.title ?? null}, meeting_date = ${input.meetingDate}, start_time = ${input.startTime ?? null},
      timezone = ${input.timezone ?? null}, duration_minutes = ${input.durationMinutes ?? null}, location = ${input.location ?? null},
      attendees = ${input.attendees ?? null}, agenda = ${input.agenda ?? null}, notes = ${input.notes ?? null}
    where id = ${id} and business_id = ${businessId}
  `;
}

export async function deleteMeetingNote(id: string, businessId: string): Promise<void> {
  await sql`delete from meeting_notes where id = ${id} and business_id = ${businessId}`;
  // Tags only used on this note would otherwise linger in the sidebar.
  await sql`
    delete from note_tags nt
    where nt.business_id = ${businessId}
      and not exists (select 1 from meeting_note_tags mt where mt.tag_id = nt.id)
  `;
}

// ---------------------------------------------------------------------------
// Folders and tags — personal to each person (teamMemberId null = owner).
// ---------------------------------------------------------------------------

export async function listNoteFolders(businessId: string, teamMemberId: string | null): Promise<NoteFolder[]> {
  const rows = await sql`
    select id, name, parent_id from note_folders
    where business_id = ${businessId} and team_member_id is not distinct from ${teamMemberId}::uuid
    order by lower(name) asc
  `;
  return (rows as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    parentId: (r.parent_id as string | null) ?? null,
  }));
}

export async function getNoteFolder(id: string, businessId: string, teamMemberId: string | null): Promise<NoteFolder | null> {
  const rows = await sql`
    select id, name, parent_id from note_folders
    where id = ${id} and business_id = ${businessId} and team_member_id is not distinct from ${teamMemberId}::uuid
  `;
  const r = rows[0] as Record<string, unknown> | undefined;
  return r ? { id: r.id as string, name: r.name as string, parentId: (r.parent_id as string | null) ?? null } : null;
}

export async function createNoteFolder(
  businessId: string,
  teamMemberId: string | null,
  name: string,
  parentId: string | null
): Promise<string> {
  const rows = await sql`
    insert into note_folders (business_id, team_member_id, name, parent_id)
    values (${businessId}, ${teamMemberId}, ${name}, ${parentId})
    returning id
  `;
  return (rows[0] as Record<string, unknown>).id as string;
}

export async function renameNoteFolder(id: string, businessId: string, teamMemberId: string | null, name: string): Promise<void> {
  await sql`
    update note_folders set name = ${name}
    where id = ${id} and business_id = ${businessId} and team_member_id is not distinct from ${teamMemberId}::uuid
  `;
}

/** Subfolders go with it (cascade); the notes inside just become unfiled — notes themselves are never deleted here. */
export async function deleteNoteFolder(id: string, businessId: string, teamMemberId: string | null): Promise<void> {
  await sql`
    delete from note_folders
    where id = ${id} and business_id = ${businessId} and team_member_id is not distinct from ${teamMemberId}::uuid
  `;
}

/** Files a note into one of this person's folders, or unfiles it (folderId null). Callers must have checked the folder belongs to this person. */
export async function setNoteFolder(
  noteId: string,
  businessId: string,
  teamMemberId: string | null,
  folderId: string | null
): Promise<void> {
  await sql`
    delete from note_folder_items
    where meeting_note_id = ${noteId} and business_id = ${businessId} and team_member_id is not distinct from ${teamMemberId}::uuid
  `;
  if (folderId) {
    await sql`
      insert into note_folder_items (meeting_note_id, folder_id, business_id, team_member_id)
      values (${noteId}, ${folderId}, ${businessId}, ${teamMemberId})
    `;
  }
}

/** Lowercased, trimmed, de-duplicated — same convention as to-do tags. */
export function normalizeNoteTags(tags: string[]): string[] {
  return Array.from(new Set(tags.map((t) => t.trim().replace(/^#/, "").toLowerCase()).filter(Boolean)));
}

/** Replaces this person's tags on a note, then drops any of their tags no longer used on any note. */
export async function setNoteTags(noteId: string, businessId: string, teamMemberId: string | null, tags: string[]): Promise<void> {
  await sql`
    delete from meeting_note_tags mt
    using note_tags nt
    where nt.id = mt.tag_id and mt.meeting_note_id = ${noteId} and mt.business_id = ${businessId}
      and nt.team_member_id is not distinct from ${teamMemberId}::uuid
  `;
  for (const name of normalizeNoteTags(tags)) {
    const rows = await sql`
      insert into note_tags (business_id, team_member_id, name)
      values (${businessId}, ${teamMemberId}, ${name})
      on conflict (business_id, coalesce(team_member_id, '00000000-0000-0000-0000-000000000000'::uuid), name)
      do update set name = excluded.name
      returning id
    `;
    const tagId = (rows[0] as Record<string, unknown>).id as string;
    await sql`
      insert into meeting_note_tags (meeting_note_id, tag_id, business_id)
      values (${noteId}, ${tagId}, ${businessId})
      on conflict do nothing
    `;
  }
  await sql`
    delete from note_tags nt
    where nt.business_id = ${businessId} and nt.team_member_id is not distinct from ${teamMemberId}::uuid
      and not exists (select 1 from meeting_note_tags mt where mt.tag_id = nt.id)
  `;
}

/** This person's tag names, for the tag field's suggestions. */
export async function listNoteTagNames(businessId: string, teamMemberId: string | null): Promise<string[]> {
  const rows = await sql`
    select name from note_tags
    where business_id = ${businessId} and team_member_id is not distinct from ${teamMemberId}::uuid
    order by name asc
  `;
  return (rows as Record<string, unknown>[]).map((r) => r.name as string);
}
