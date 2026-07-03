export const NAV_LINKS = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/clients", label: "Clients", icon: "clients" },
  { href: "/leads", label: "Leads", icon: "leads" },
  { href: "/meeting-notes", label: "Meeting Notes", tabLabel: "Notes", icon: "meetingNotes" },
  { href: "/todos", label: "To-Dos", icon: "todos" },
] as const;

export type NavIconKey = (typeof NAV_LINKS)[number]["icon"];
