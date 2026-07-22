import type { CurrentUser, TeamMember } from "@/lib/types";
import { buildAssignOptions } from "@/lib/assign";

/** Matches the `@[Name](id)` tokens MentionTextarea writes into a note body — id is either a team member's uuid or the literal sentinel "OWNER". */
const MENTION_RE = /@\[([^\]]+)\]\(([\w-]+)\)/g;

export type MentionSegment = { type: "text"; value: string } | { type: "mention"; value: string; id: string };

/** Splits a note body into plain-text and @mention segments for rendering. Client-safe (no server-only imports) — used by both the note-composer and the note-list display. */
export function parseMentionSegments(body: string): MentionSegment[] {
  const segments: MentionSegment[] = [];
  let lastIndex = 0;
  for (const match of body.matchAll(MENTION_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) segments.push({ type: "text", value: body.slice(lastIndex, index) });
    segments.push({ type: "mention", value: match[1], id: match[2] });
    lastIndex = index + match[0].length;
  }
  if (lastIndex < body.length) segments.push({ type: "text", value: body.slice(lastIndex) });
  return segments;
}

/** Unique raw ids ("OWNER" or a team member id) mentioned in a note body — the candidate recipients for the mention notification fired when the note is saved. */
export function extractMentionIds(body: string): string[] {
  const ids = new Set<string>();
  for (const match of body.matchAll(MENTION_RE)) ids.add(match[2]);
  return [...ids];
}

export interface MentionOption {
  id: string;
  label: string;
}

/**
 * Who can be @mentioned on a note: everyone buildAssignOptions would let you
 * hand a task to, minus "Me" (mentioning yourself is a no-op). `accessTeamMemberIds`
 * — when non-null — further restricts the pool to people who can actually
 * open the page a mention notification would link to; pass null for leads,
 * which have no per-member access list to check against.
 */
export function mentionOptions(
  user: CurrentUser,
  teamMembers: TeamMember[],
  accessTeamMemberIds: string[] | null
): MentionOption[] {
  const allowed = accessTeamMemberIds ? new Set(accessTeamMemberIds) : null;
  return buildAssignOptions(user, teamMembers)
    .filter((o) => o.value !== "")
    .filter((o) => (o.value === "OWNER" ? user.role !== "OWNER" : allowed ? allowed.has(o.value) : true))
    .map((o) => ({ id: o.value, label: o.label }));
}
