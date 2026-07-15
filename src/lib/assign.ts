import type { CurrentUser, TeamMember } from "@/lib/types";

/** The viewer's own board identity: null for the business owner, a team member's row id otherwise. */
export function selfId(user: CurrentUser): string | null {
  return user.role === "TEAM_MEMBER" ? user.teamMember.id : null;
}

/**
 * "Me" always comes first (value "" means "assign to whoever is currently
 * viewing this dropdown"); everyone else you can hand something to follows.
 * The owner sometimes also has their own row in team_members (e.g. to track
 * their own billable hours in the tracker) — that row is filtered out here
 * since "Me"/"Owner" already represent that same person, and leaving it in
 * would show the owner's name twice. Once the owner has explicitly linked
 * that row (Settings > Team Members > "This is me" — businesses.owner_team_member_id),
 * we exclude it by exact id match; otherwise we fall back to a best-effort
 * match on normalized name/email, which can miss real-world variants.
 *
 * Mirrors buildAssignOptions in app/(app)/todos/page.tsx — kept separate
 * rather than shared, so changes here can't regress the already-working
 * to-do assignment flow.
 */
export function buildAssignOptions(user: CurrentUser, teamMembers: TeamMember[]): { value: string; label: string }[] {
  const ownerTeamMemberId = user.business.ownerTeamMemberId;
  const normalizedOwnerName = user.business.ownerName.trim().toLowerCase();
  const normalizedOwnerEmail = user.business.ownerEmail.trim().toLowerCase();
  const otherMembers = teamMembers.filter((tm) => {
    if (ownerTeamMemberId) return tm.id !== ownerTeamMemberId;
    const isOwnersName = tm.name.trim().toLowerCase() === normalizedOwnerName;
    const isOwnersEmail = !!tm.email && tm.email.trim().toLowerCase() === normalizedOwnerEmail;
    return !isOwnersName && !isOwnersEmail;
  });
  const options = [{ value: "", label: "Me" }];
  if (user.role === "TEAM_MEMBER") {
    options.push({ value: "OWNER", label: "Owner" });
    for (const tm of otherMembers) {
      if (tm.id !== user.teamMember.id) options.push({ value: tm.id, label: tm.name });
    }
  } else {
    for (const tm of otherMembers) options.push({ value: tm.id, label: tm.name });
  }
  return options;
}

/**
 * The "Assign to" <select>'s value convention: "" for the viewer themselves,
 * "OWNER" for the owner, otherwise a team member's row id. A selection
 * matching the owner's own linked team_members row is normalized to the
 * same null value as "OWNER" — otherwise it would be invisible on the
 * owner's own view, since nothing else in the app treats that row as
 * equivalent to the owner. Mirrors resolveAssignee in lib/actions/tasks.ts.
 */
export function resolveAssignedTeamMemberId(raw: string | null, user: CurrentUser): string | null {
  if (raw === null || raw === "") return selfId(user);
  if (raw === "OWNER" || raw === user.business.ownerTeamMemberId) return null;
  return raw;
}

/** Reverse of resolveAssignedTeamMemberId — the <select>'s value for an already-assigned row, so the viewer's own assignment shows as "Me"/"Owner" rather than a raw id or a generic "unassigned" state. */
export function assigneeSelectValue(assignedToTeamMemberId: string | null, currentAssigneeId: string | null): string {
  if (assignedToTeamMemberId === currentAssigneeId) return "";
  if (assignedToTeamMemberId === null) return "OWNER";
  return assignedToTeamMemberId;
}
