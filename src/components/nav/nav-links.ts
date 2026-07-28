export const NAV_LINKS = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/clients", label: "Clients", icon: "clients" },
  { href: "/leads", label: "Leads", icon: "leads" },
  { href: "/lead-analytics", label: "Lead Insights", tabLabel: "Insights", icon: "leadAnalytics" },
  { href: "/meeting-notes", label: "Meeting Notes", tabLabel: "Notes", icon: "meetingNotes" },
  { href: "/calendar", label: "Calendar", icon: "calendar" },
  { href: "/follow-ups", label: "Follow-ups", icon: "followUps" },
  {
    href: "/invoices",
    label: "Finance",
    tabLabel: "Finance",
    icon: "finance",
    // Revenue Tracking and Hour & Cost Tracker live under one Finance nav
    // entry with an in-page tab switcher — the sidebar link should read as
    // active on either sub-page, not just the one its href points to.
    matchPrefixes: ["/invoices", "/tracker"],
  },
  { href: "/todos", label: "To-Dos", icon: "todos" },
] as const;

export type NavIconKey = (typeof NAV_LINKS)[number]["icon"] | "settings" | "admin";

/** The mobile bottom tab bar only has room for a few links — the rest live in the drawer. */
const MOBILE_TAB_HREFS = ["/", "/clients", "/todos"];
export const MOBILE_TAB_LINKS = NAV_LINKS.filter((link) => MOBILE_TAB_HREFS.includes(link.href));
