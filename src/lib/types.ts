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
/**
 * CLIENT/LEAD are fixed system types tied structurally to an actual
 * client_id/lead_id (enforced by a DB check constraint) — not editable
 * or archivable. CUSTOM covers everything else (General, Personal,
 * Audax Ventures, H2MB, Other, and anything added later), whose actual
 * category lives in the editable `todo_types` table — see Task.todoTypeId.
 */
export type TaskType = "CLIENT" | "LEAD" | "CUSTOM";
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

export interface ClientDocument {
  id: string;
  clientId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  label: string | null;
  uploadedBy: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: TaskStatus;
  type: TaskType;
  /** Set (and meaningful) only when type === "CUSTOM". */
  todoTypeId: string | null;
  todoTypeName: string | null;
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
  workTypeId: string | null;
  workTypeName: string | null;
  /** Free text, used only when the selected work type is the "Other" fallback row. */
  workTypeOther: string | null;
  startDate: string | null;
  budgetedHours: number | null;
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
  documents: ClientDocument[];
}

export interface Lead {
  id: string;
  companyName: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: LeadStatus;
  estimatedValue: string | null;
  workTypeId: string | null;
  workTypeName: string | null;
  workTypeOther: string | null;
  sourceId: string | null;
  sourceName: string | null;
  /** Free text, used only when the selected source is the "Other" fallback row. */
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

export interface TeamMember {
  id: string;
  name: string;
  defaultHourlyRate: string;
  active: boolean;
  createdAt: string;
}

export interface WorkCategory {
  id: string;
  name: string;
  defaultHourlyRate: string;
  active: boolean;
  createdAt: string;
}

/** Editable list backing Client/Lead "work type" dropdowns (Settings → Client & Lead Work Types). */
export interface WorkType {
  id: string;
  name: string;
  /** The one row that shows the "please specify" free-text field when selected. */
  isFallback: boolean;
  active: boolean;
  createdAt: string;
}

/** Editable list backing the Lead "source" dropdown (Settings → Lead Sources). */
export interface LeadSource {
  id: string;
  name: string;
  isFallback: boolean;
  active: boolean;
  createdAt: string;
}

/** Editable list backing the to-do "type" dropdown for non-Client/Lead tasks (Settings → To-Do Types). */
export interface TodoType {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export interface Profile {
  name: string;
  email: string;
  updatedAt: string;
}

export interface BusinessEntity {
  id: string;
  name: string;
  address: string | null;
  contactInfo: string | null;
  active: boolean;
  createdAt: string;
}

/** Non-sensitive app settings safe to pass to client components — never includes the passcode hash/salt. */
export interface AppSettings {
  invoiceAgingUnderDays: number;
  invoiceAgingOverDays: number;
  hasCustomPasscode: boolean;
}

export type FixedCostCategory = "SOFTWARE_TOOLS" | "CONTRACTOR" | "LICENSING" | "OTHER";

export const FIXED_COST_CATEGORY_LABELS: Record<FixedCostCategory, string> = {
  SOFTWARE_TOOLS: "Software / Tools",
  CONTRACTOR: "Contractor",
  LICENSING: "Licensing",
  OTHER: "Other",
};

export const FIXED_COST_CATEGORY_ORDER: FixedCostCategory[] = [
  "SOFTWARE_TOOLS",
  "CONTRACTOR",
  "LICENSING",
  "OTHER",
];

export type CostEntryType = "TIME" | "FIXED_COST";

/** A time entry or fixed cost, normalized to one shape for the combined entry log. */
export interface CostEntry {
  id: string;
  entryType: CostEntryType;
  clientId: string | null;
  leadId: string | null;
  ownerName: string;
  date: string;
  description: string | null;
  hours: number | null;
  rate: number | null;
  billable: boolean | null;
  teamMemberName: string | null;
  /** Work category (Admin Hours, Professional Development, ...) — time entries only. */
  workCategoryId: string | null;
  workCategoryName: string | null;
  /** Fixed-cost category (Software/Tools, Contractor, ...) — a separate concept from workCategory, fixed costs only. */
  category: FixedCostCategory | null;
  /** hours × rate for a time entry, or the flat amount for a fixed cost. */
  amount: number;
  createdAt: string;
}

export interface CostRollup {
  billableHours: number;
  nonBillableHours: number;
  totalHours: number;
  /** Cost of billable hours only — non-billable time isn't part of what was priced. */
  variableCost: number;
  fixedCost: number;
  totalCost: number;
}

export interface CategoryBreakdown {
  categoryId: string | null;
  /** "Uncategorized" when categoryId is null. */
  categoryName: string;
  billableHours: number;
  nonBillableHours: number;
  cost: number;
}

export interface CostSummary extends CostRollup {
  totalInvoiced: number;
  profit: number;
  /** Null when nothing has been invoiced yet — a percentage isn't meaningful without a denominator. */
  profitMarginPercent: number | null;
  /** Null when there are no billable hours to divide by. */
  effectiveHourlyRate: number | null;
  budgetedHours: number | null;
  overBudget: boolean;
  categoryBreakdown: CategoryBreakdown[];
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

/** Labels for the two fixed system types; CUSTOM tasks use their joined todoTypeName instead. */
export const FIXED_TASK_TYPE_LABELS: Record<"CLIENT" | "LEAD", string> = {
  CLIENT: "Client",
  LEAD: "Lead",
};

export const FOLLOWUP_STATUS_LABELS: Record<FollowUpStatus, string> = {
  UPCOMING: "Upcoming",
  COMPLETED: "Completed",
};

export const INVOICE_AGE_BRACKET_ORDER: InvoiceAgeBracket[] = [
  "UNDER_15",
  "DAYS_15_30",
  "OVER_30",
];

export function invoiceAgeBracket(
  daysOutstanding: number,
  underDays: number,
  overDays: number
): InvoiceAgeBracket {
  if (daysOutstanding >= overDays) return "OVER_30";
  if (daysOutstanding >= underDays) return "DAYS_15_30";
  return "UNDER_15";
}

/** Bracket labels reflect the currently configured thresholds (Settings → Invoice Aging), not fixed 15/30 text. */
export function invoiceAgeBracketLabels(underDays: number, overDays: number): Record<InvoiceAgeBracket, string> {
  return {
    UNDER_15: `0–${underDays - 1} days`,
    DAYS_15_30: `${underDays}–${overDays} days`,
    OVER_30: `${overDays}+ days`,
  };
}
