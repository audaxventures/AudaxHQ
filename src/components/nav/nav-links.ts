export const NAV_LINKS = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/clients", label: "Clients", icon: "clients" },
  { href: "/leads", label: "Leads", icon: "leads" },
  { href: "/lead-analytics", label: "Lead Analytics", tabLabel: "Analytics", icon: "leadAnalytics" },
  { href: "/meeting-notes", label: "Meeting Notes", tabLabel: "Notes", icon: "meetingNotes" },
  { href: "/calendar", label: "Calendar", icon: "calendar" },
  { href: "/invoices", label: "Invoice Aging", tabLabel: "Invoices", icon: "invoices" },
  { href: "/tracker", label: "Hour & Cost Tracker", tabLabel: "Tracker", icon: "tracker" },
  { href: "/todos", label: "To-Dos", icon: "todos" },
] as const;

export type NavIconKey = (typeof NAV_LINKS)[number]["icon"] | "settings";
