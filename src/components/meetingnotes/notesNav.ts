/**
 * Shared, non-component helpers for the Notes page — kept out of the
 * "use client" files so the server page can call them too.
 */
import { Building2, Handshake, Inbox, Lock, NotebookPen, Target, type LucideIcon } from "lucide-react";

export type NotesView = "all" | "private" | "unfiled" | "clients" | "leads" | "partners";

export interface NotesCounts {
  views: Record<NotesView, number>;
  folders: Record<string, number>;
  tags: { name: string; count: number }[];
}

export const VIEW_META: Record<NotesView, { label: string; icon: LucideIcon }> = {
  all: { label: "All notes", icon: NotebookPen },
  private: { label: "Private", icon: Lock },
  unfiled: { label: "Unfiled", icon: Inbox },
  clients: { label: "Clients", icon: Building2 },
  leads: { label: "Leads", icon: Target },
  partners: { label: "Partners", icon: Handshake },
};

/**
 * Builds a Notes-page URL. Moving to another view or folder drops the
 * client/lead/partner picker (it only applies on its own tab); search,
 * date range, sort and tags carry over.
 */
export function notesHref(current: Record<string, string | undefined>, changes: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  const movingTab = "view" in changes || "folder" in changes;
  for (const [k, v] of Object.entries({ ...current, ...changes })) {
    if (!v || k === "note") continue;
    if (movingTab && (k === "clientId" || k === "leadId" || k === "partnerId") && !(k in changes)) continue;
    params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `/meeting-notes?${qs}` : "/meeting-notes";
}

export const DATE_RANGES = {
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  year: "This year",
  lastyear: "Last year",
} as const;
export type DateRange = keyof typeof DATE_RANGES;
