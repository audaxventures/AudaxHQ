// `group` drives the section-label dividers rendered in SidebarNavList —
// purely a visual grouping of the flat link list, not a route/page change.
// Dashboard is intentionally left out of a group so it sits alone at the
// top, above the first divider.
export const NAV_LINKS = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/clients", label: "Clients", icon: "clients", group: "Relationships" },
  { href: "/partners", label: "Partners", icon: "partners", group: "Relationships" },
  { href: "/prospects", label: "Prospects", icon: "prospects", group: "Pipeline" },
  { href: "/leads", label: "Leads", icon: "leads", group: "Pipeline" },
  { href: "/lead-analytics", label: "Insights", icon: "leadAnalytics", group: "Pipeline" },
  { href: "/meeting-notes", label: "Meeting Notes", tabLabel: "Notes", icon: "meetingNotes", group: "Operations" },
  { href: "/calendar", label: "Calendar", icon: "calendar", group: "Operations" },
  { href: "/follow-ups", label: "Follow-ups", icon: "followUps", group: "Operations" },
  {
    href: "/invoices",
    label: "Finance",
    tabLabel: "Finance",
    icon: "finance",
    group: "Operations",
    // Revenue Tracking and Hour & Cost Tracker live under one Finance nav
    // entry with an in-page tab switcher — the sidebar link should read as
    // active on either sub-page, not just the one its href points to.
    matchPrefixes: ["/invoices", "/tracker"],
  },
  { href: "/todos", label: "To-Dos", icon: "todos", group: "Operations" },
] as const;

export type NavIconKey = (typeof NAV_LINKS)[number]["icon"] | "settings" | "admin";

/** The mobile bottom tab bar only has room for a few links — the rest live in the drawer. */
const MOBILE_TAB_HREFS = ["/", "/clients", "/todos"];
export const MOBILE_TAB_LINKS = NAV_LINKS.filter((link) => MOBILE_TAB_HREFS.includes(link.href));
