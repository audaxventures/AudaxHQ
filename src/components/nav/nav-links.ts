export const NAV_LINKS = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/clients", label: "Clients", icon: "clients" },
  { href: "/leads", label: "Leads", icon: "leads" },
  { href: "/lead-analytics", label: "Lead Insights", tabLabel: "Insights", icon: "leadAnalytics" },
  { href: "/meeting-notes", label: "Meeting Notes", tabLabel: "Notes", icon: "meetingNotes" },
  // Calendar nav link intentionally removed — the feature is hidden (see
  // HIDDEN_PATH_PREFIXES in src/proxy.ts) while its scope gets rethought.
  // The page, data, and migrations are untouched; re-add this line and the
  // proxy.ts block to bring it back.
  { href: "/follow-ups", label: "Follow-ups", icon: "followUps" },
  { href: "/invoices", label: "Revenue Tracking", tabLabel: "Revenue", icon: "invoices" },
  { href: "/tracker", label: "Hour & Cost Tracker", tabLabel: "Tracker", icon: "tracker" },
  { href: "/todos", label: "To-Dos", icon: "todos" },
] as const;

export type NavIconKey = (typeof NAV_LINKS)[number]["icon"] | "settings" | "admin";

/** The mobile bottom tab bar only has room for a few links — the rest live in the drawer. */
const MOBILE_TAB_HREFS = ["/", "/clients", "/todos"];
export const MOBILE_TAB_LINKS = NAV_LINKS.filter((link) => MOBILE_TAB_HREFS.includes(link.href));
