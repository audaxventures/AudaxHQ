export type ClientType = "PROJECT" | "RECURRING";
export type ClientStatus = "ACTIVE" | "PAUSED" | "CHURNED";
export type InvoiceStatus = "NOT_INVOICED" | "INVOICED" | "PAID";
export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "PROPOSAL_SENT"
  | "NEGOTIATING"
  | "WON"
  | "LOST";
export type TaskStatus =
  | "TO_BE_DONE"
  | "IN_PROGRESS"
  | "AWAITING_CLIENT_FEEDBACK"
  | "COMPLETED";
export type TaskType =
  | "CLIENT"
  | "LEAD"
  | "GENERAL"
  | "PERSONAL"
  | "AUDAX_VENTURES"
  | "H2MB"
  | "OTHER";
export type WorkType =
  | "SOFTWARE_DEVELOPMENT"
  | "FRACTIONAL_CAIO"
  | "FRACTIONAL_COO"
  | "FRACTIONAL_CMO"
  | "MARKETING_SERVICES"
  | "WEBSITE_DEVELOPMENT"
  | "ADVISORY"
  | "OTHER";
export type LeadSource =
  | "REFERRAL"
  | "COLD_OUTREACH"
  | "RILEY_OUTREACH"
  | "AD"
  | "INBOUND"
  | "OTHER";
export type FollowUpStatus = "UPCOMING" | "COMPLETED";
export type InvoiceAgeBracket = "UNDER_15" | "DAYS_15_30" | "OVER_30";

export interface ClientLink {
  id: string;
  clientId: string;
  label: string;
  url: string;
}

export interface ClientNote {
  id: string;
  clientId: string;
  body: string;
  createdAt: string;
}

export interface LeadNote {
  id: string;
  leadId: string;
  body: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  clientId: string;
  label: string;
  amount: string;
  status: InvoiceStatus;
  invoicedDate: string | null;
  paidDate: string | null;
  periodMonth: number | null;
  periodYear: number | null;
  createdAt: string;
}

export interface FollowUp {
  id: string;
  clientId: string | null;
  leadId: string | null;
  label: string;
  date: string;
  status: FollowUpStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingNote {
  id: string;
  clientId: string | null;
  leadId: string | null;
  meetingDate: string;
  attendees: string | null;
  notes: string;
  createdAt: string;
  // present when returned from a query that joins in the owner's name
  ownerName?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: TaskStatus;
  type: TaskType;
  clientId: string | null;
  leadId: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  // present when returned from a query that joins in the owner's name
  clientName?: string;
  leadName?: string;
}

export interface Client {
  id: string;
  companyName: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  type: ClientType;
  status: ClientStatus;
  rate: string;
  workType: WorkType | null;
  workTypeOther: string | null;
  startDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientWithRelations extends Client {
  tasks: Task[];
  notes: ClientNote[];
  links: ClientLink[];
  invoices: Invoice[];
  followUps: FollowUp[];
  meetingNotes: MeetingNote[];
}

export interface Lead {
  id: string;
  companyName: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: LeadStatus;
  estimatedValue: string | null;
  workType: WorkType | null;
  workTypeOther: string | null;
  source: LeadSource | null;
  sourceOther: string | null;
  createdAt: string;
  updatedAt: string;
  convertedClientId: string | null;
}

export interface LeadWithRelations extends Lead {
  notes: LeadNote[];
  tasks: Task[];
  followUps: FollowUp[];
  meetingNotes: MeetingNote[];
}

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  CHURNED: "Churned",
};

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  PROJECT: "Project-based",
  RECURRING: "Recurring",
};

export const CLIENT_TYPE_ORDER: ClientType[] = ["PROJECT", "RECURRING"];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  NOT_INVOICED: "Not invoiced",
  INVOICED: "Invoiced",
  PAID: "Paid",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  PROPOSAL_SENT: "Proposal sent",
  NEGOTIATING: "Negotiating",
  WON: "Won",
  LOST: "Lost",
};

export const LEAD_STATUS_ORDER: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "PROPOSAL_SENT",
  "NEGOTIATING",
  "WON",
  "LOST",
];

export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  SOFTWARE_DEVELOPMENT: "Software Development",
  FRACTIONAL_CAIO: "Fractional CAIO",
  FRACTIONAL_COO: "Fractional COO",
  FRACTIONAL_CMO: "Fractional CMO",
  MARKETING_SERVICES: "Marketing Services",
  WEBSITE_DEVELOPMENT: "Website Development",
  ADVISORY: "Advisory",
  OTHER: "Other",
};

export const WORK_TYPE_ORDER: WorkType[] = [
  "SOFTWARE_DEVELOPMENT",
  "FRACTIONAL_CAIO",
  "FRACTIONAL_COO",
  "FRACTIONAL_CMO",
  "MARKETING_SERVICES",
  "WEBSITE_DEVELOPMENT",
  "ADVISORY",
  "OTHER",
];

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  REFERRAL: "Referral",
  COLD_OUTREACH: "Cold Outreach",
  RILEY_OUTREACH: "Riley Outreach",
  AD: "Ad",
  INBOUND: "Inbound",
  OTHER: "Other",
};

export const LEAD_SOURCE_ORDER: LeadSource[] = [
  "REFERRAL",
  "COLD_OUTREACH",
  "RILEY_OUTREACH",
  "AD",
  "INBOUND",
  "OTHER",
];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TO_BE_DONE: "To Be Done",
  IN_PROGRESS: "In Progress",
  AWAITING_CLIENT_FEEDBACK: "Awaiting Client Feedback",
  COMPLETED: "Completed",
};

export const TASK_STATUS_ORDER: TaskStatus[] = [
  "TO_BE_DONE",
  "IN_PROGRESS",
  "AWAITING_CLIENT_FEEDBACK",
  "COMPLETED",
];

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  CLIENT: "Client",
  LEAD: "Lead",
  GENERAL: "General",
  PERSONAL: "Personal",
  AUDAX_VENTURES: "Audax Ventures",
  H2MB: "H2MB",
  OTHER: "Other",
};

export const TASK_TYPE_ORDER: TaskType[] = [
  "CLIENT",
  "LEAD",
  "GENERAL",
  "PERSONAL",
  "AUDAX_VENTURES",
  "H2MB",
  "OTHER",
];

export const FOLLOWUP_STATUS_LABELS: Record<FollowUpStatus, string> = {
  UPCOMING: "Upcoming",
  COMPLETED: "Completed",
};

export const INVOICE_AGE_BRACKET_LABELS: Record<InvoiceAgeBracket, string> = {
  UNDER_15: "0–14 days",
  DAYS_15_30: "15–30 days",
  OVER_30: "30+ days",
};

export const INVOICE_AGE_BRACKET_ORDER: InvoiceAgeBracket[] = [
  "UNDER_15",
  "DAYS_15_30",
  "OVER_30",
];

export function invoiceAgeBracket(daysOutstanding: number): InvoiceAgeBracket {
  if (daysOutstanding >= 30) return "OVER_30";
  if (daysOutstanding >= 15) return "DAYS_15_30";
  return "UNDER_15";
}
