import type { LucideIcon } from "lucide-react";
import { Building2, Clock, NotebookPen, UserPlus, CheckSquare } from "lucide-react";

interface QuickAction {
  href: string;
  label: string;
  /** Shown instead of `label` in the desktop dashboard row, where 5 tiles share a row and a long label truncates awkwardly. */
  shortLabel?: string;
  icon: LucideIcon;
  iconClasses: string;
}

/** Shared by the mobile QuickActionsFab sheet and the desktop dashboard's quick-actions row. */
export const QUICK_ACTIONS: QuickAction[] = [
  { href: "/leads/new", label: "New Lead", icon: UserPlus, iconClasses: "bg-navy-100 text-navy-700" },
  { href: "/clients/new", label: "New Client", icon: Building2, iconClasses: "bg-sage-100 text-sage-600" },
  { href: "/todos?new=1", label: "Add To-Do", icon: CheckSquare, iconClasses: "bg-burnt-100 text-burnt-600" },
  { href: "/tracker?logTime=1", label: "Log Time", icon: Clock, iconClasses: "bg-blue-100 text-blue-600" },
  {
    href: "/meeting-notes/new",
    label: "Create Meeting Note",
    shortLabel: "Meeting Note",
    icon: NotebookPen,
    iconClasses: "bg-gold-100 text-gold-600",
  },
];
