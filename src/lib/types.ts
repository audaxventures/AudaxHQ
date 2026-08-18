export type ClientType = "PROJECT" | "RECURRING";
export type ClientStatus = "ACTIVE" | "PAUSED" | "CHURNED";
export type InvoiceStatus = "NOT_INVOICED" | "INVOICED" | "PAID";
export type InvoiceType = "FIXED" | "HOURLY";
export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "PROPOSAL_SENT"
  | "NEGOTIATING"
  | "WON"
  | "LOST";
export type ProspectStatus =
  | "NEW"
  | "CONTACTED"
  | "ATTEMPTED"
  | "QUALIFIED"
  | "NOT_INTERESTED"
  | "CONVERTED";
export type ProspectActivityType = "CALL" | "EMAIL" | "MEETING" | "NOTE";
export type TaskStatus =
  | "TO_BE_DONE"
  | "IN_PROGRESS"
  | "AWAITING_CLIENT_FEEDBACK"
  | "COMPLETED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
/**
 * CLIENT/LEAD/PARTNER are fixed system types tied structurally to an
 * actual client_id/lead_id/partner_id (enforced by a DB check
 * constraint) — not editable or archivable. CUSTOM covers everything
 * else (General, Personal, Audax Ventures, H2MB, Other, and anything
 * added later), whose actual category lives in the editable
 * `todo_types` table — see Task.todoTypeId.
 */
export type TaskType = "CLIENT" | "LEAD" | "PARTNER" | "CUSTOM";
export type FollowUpStatus = "UPCOMING" | "COMPLETED";
export type InvoiceAgeBracket = "UNDER_15" | "DAYS_15_30" | "OVER_30";
/** An operator-assignable accent color for a client or lead, used for avatars and accent bars across the app. */
export type EntityColor = "navy" | "slate" | "blue" | "teal" | "sage" | "burnt" | "gold" | "brick" | "rose" | "violet";

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
  /** Who wrote it — null means the business owner, or (for notes created before this field existed) unknown; the UI can't tell those apart and shows "Owner" either way. */
  authorTeamMemberId: string | null;
  authorName: string | null;
}

export interface LeadNote {
  id: string;
  leadId: string;
  body: string;
  createdAt: string;
  authorTeamMemberId: string | null;
  authorName: string | null;
}

export interface Invoice {
  id: string;
  clientId: string;
  label: string;
  amount: string;
  invoiceType: InvoiceType;
  hours: string | null;
  hourlyRate: string | null;
  description: string | null;
  status: InvoiceStatus;
  invoicedDate: string | null;
  paidDate: string | null;
  periodMonth: number | null;
  periodYear: number | null;
  /** Set once at creation (defaulted from the client's work type), never rewritten on edit — see migration 035. */
  workTypeId: string | null;
  workTypeName: string | null;
  workTypeOther: string | null;
  createdAt: string;
}

export interface FollowUp {
  id: string;
  clientId: string | null;
  leadId: string | null;
  partnerId: string | null;
  prospectId: string | null;
  label: string;
  date: string;
  status: FollowUpStatus;
  createdAt: string;
  updatedAt: string;
  /** Who's responsible for it — null means unassigned. */
  assignedToTeamMemberId: string | null;
}

export type NotificationType = "TASK_ASSIGNED" | "FOLLOW_UP_ASSIGNED" | "MENTION";

/** A persisted "someone assigned you something" event — see migration 032. Time-based nudges (overdue/due-today) are computed live instead; see getNotificationSnapshot in src/lib/data/notifications.ts. */
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  link: string | null;
  createdAt: string;
  readAt: string | null;
}

/** A live-computed (never persisted) "this needs attention right now" item for the notification bell's second section. */
export interface RightNowItem {
  id: string;
  label: string;
  link: string;
  kind: "task" | "follow-up";
  isOverdue: boolean;
}

export interface MeetingNote {
  id: string;
  /** Falls back to the client/lead name in the UI when not set (legacy notes created before titles existed). */
  title: string | null;
  clientId: string | null;
  leadId: string | null;
  partnerId: string | null;
  meetingDate: string;
  /** "HH:MM:SS" (24-hour) or null if only a date was set — see migration 029. */
  startTime: string | null;
  /** IANA identifier (e.g. "America/New_York") startTime is in — purely descriptive, never used for conversion. Null on notes created before migration 036 or left unset. */
  timezone: string | null;
  durationMinutes: number | null;
  location: string | null;
  attendees: string | null;
  /** Rich text (sanitized HTML) — what's planned to be discussed, fillable before the meeting happens. */
  agenda: string | null;
  /** Rich text (sanitized HTML) — what was actually discussed. */
  notes: string | null;
  /** Rich text (sanitized HTML) — legacy free-text action items, from before the quick-add-to-do UI existed. Still shown read-only when present; no longer written to. */
  actionItems: string | null;
  createdAt: string;
  // present when returned from a query that joins in the owner's name/color
  ownerName?: string;
  ownerColor?: EntityColor | null;
  /** The client/lead's contact email, joined in for the PDF-email action — present when returned from listMeetingNotes/getMeetingNoteById. */
  ownerEmail?: string | null;
  /** The client/lead's contact person name (not the company name) — used for the email greeting, falls back to the company name when unset. */
  ownerContactName?: string | null;
  /** To-dos quick-added from this meeting's action items — present when returned from listMeetingNotes. */
  actionItemTasks?: MeetingActionItemTask[];
  /** Last time this note's branded PDF was emailed out, and to whom — null until the first send. */
  lastEmailedTo: string | null;
  lastEmailedAt: string | null;
}

/** Whose action item this is — 'TEAM' shows up on the workspace's own to-do board; 'EXTERNAL' is the client/lead's own commitment and stays attached to the meeting note only. */
export type TaskOwner = "TEAM" | "EXTERNAL";

/** A minimal projection of a Task, for showing a meeting note's linked action items without a full Task join. */
export interface MeetingActionItemTask {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: string | null;
  ownedBy: TaskOwner;
  /** Who it's assigned to on the team's own board — the business owner's name when unassigned. Only meaningful when ownedBy is "TEAM"; an "EXTERNAL" item is the client/lead's own commitment, shown against their name instead. */
  assigneeName: string;
}

export interface Document {
  id: string;
  clientId: string | null;
  leadId: string | null;
  partnerId: string | null;
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
  priority: TaskPriority;
  type: TaskType;
  /** Set (and meaningful) only when type === "CUSTOM". */
  todoTypeId: string | null;
  todoTypeName: string | null;
  clientId: string | null;
  leadId: string | null;
  partnerId: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  // present when returned from a query that joins in the owner's name/color
  clientName?: string;
  leadName?: string;
  partnerName?: string;
  clientColor?: EntityColor | null;
  leadColor?: EntityColor | null;
  partnerColor?: EntityColor | null;
  /** Whose board this to-do is currently on — null means the workspace owner. */
  assignedToTeamMemberId: string | null;
  /** Who originally created it — null means the workspace owner. Differs from assignedToTeamMemberId once a to-do has been handed off to someone else. */
  createdByTeamMemberId: string | null;
  /** "Owner" or the creating team member's name — only meaningful (and only shown by the UI) when it differs from who the to-do is assigned to now. */
  createdByName: string;
  /** Set when this to-do was quick-added as an action item from a meeting note. */
  meetingNoteId: string | null;
  /** 'TEAM' (default) shows on the workspace's own to-do board; 'EXTERNAL' is the client/lead's own commitment and is excluded from listTasks(). */
  ownedBy: TaskOwner;
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
  /** What to bill this client per hour of tracked time — separate from `rate` above (a monthly-fee/reference-total figure). Defaults an hourly invoice's rate and is what "unbilled hours" are valued at. Null if never set. */
  hourlyRate: string | null;
  workTypeId: string | null;
  workTypeName: string | null;
  /** Free text, used only when the selected work type is the "Other" fallback row. */
  workTypeOther: string | null;
  startDate: string | null;
  budgetedHours: number | null;
  color: EntityColor | null;
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
  documents: Document[];
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
  color: EntityColor | null;
  createdAt: string;
  updatedAt: string;
  convertedClientId: string | null;
  /** Who's responsible for this lead — null means nobody's claimed it yet. */
  leadOwnerTeamMemberId: string | null;
  leadOwnerName: string | null;
  leadOwnerColor: EntityColor | null;
  /** The strategic partner who referred this lead in, if any — separate from sourceId (the generic marketing-channel category). */
  referredByPartnerId: string | null;
  referredByPartnerName: string | null;
  referredByPartnerColor: EntityColor | null;
  /** Flagged as needing extra focus — sorts to the top of the Leads list ahead of the normal sort order. */
  hot: boolean;
}

export interface LeadWithRelations extends Lead {
  notes: LeadNote[];
  tasks: Task[];
  followUps: FollowUp[];
  meetingNotes: MeetingNote[];
  documents: Document[];
}

export type CommissionStatus = "OWED" | "PAID";

/** A strategic referral partner — not a client or a lead. Referrals they send in are tracked as ordinary leads tagged via Lead.referredByPartnerId, reusing the full pipeline. */
export interface Partner {
  id: string;
  companyName: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  /** Free text — commission/fee arrangements vary too much per partner to model as structured rules. */
  commissionTerms: string | null;
  active: boolean;
  color: EntityColor | null;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerNote {
  id: string;
  partnerId: string;
  body: string;
  createdAt: string;
  authorTeamMemberId: string | null;
  authorName: string | null;
}

export interface PartnerWithRelations extends Partner {
  notes: PartnerNote[];
  referredLeads: Lead[];
  followUps: FollowUp[];
  meetingNotes: MeetingNote[];
  documents: Document[];
  commissions: PartnerCommission[];
  /** Lifetime invoiced + paid revenue from clients this partner's WON referrals converted into — not tied to commission arrangements, since some partnerships send valuable referrals with no fee owed at all. Same formula as getConversionByPartner in leadAnalytics.ts. */
  revenueGenerated: number;
}

/**
 * Money owed OUT to a partner for a referral or ongoing arrangement — the
 * mirror image of Invoice (money coming IN from a client). Deliberately not
 * always tied to one referral: referredLeadId/referredClientId are both
 * nullable since some commissions (e.g. a flat retainer) aren't tied to a
 * single lead.
 */
export interface PartnerCommission {
  id: string;
  partnerId: string;
  referredLeadId: string | null;
  referredClientId: string | null;
  amount: string;
  status: CommissionStatus;
  description: string | null;
  dueDate: string | null;
  paidDate: string | null;
  createdAt: string;
}

/**
 * The funnel stage before a Lead — someone worth reaching out to, with no
 * active deal yet. Deliberately lighter-weight than Lead (no pipeline
 * value/stage/source): those only make sense once there's a real
 * opportunity. Has no detail page — managed entirely from a drawer on the
 * Prospects list page.
 */
export interface Prospect {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  businessName: string | null;
  title: string | null;
  industry: string | null;
  status: ProspectStatus;
  notes: string | null;
  /** Who's responsible for this prospect — a simple ownership tag, mirroring Lead.leadOwnerTeamMemberId, not a task-assignment relationship. */
  ownerTeamMemberId: string | null;
  ownerName: string | null;
  ownerColor: EntityColor | null;
  /** Set once converted to a Lead (see convertProspectToLead) — the prospect row stays around for history, status flips to CONVERTED. */
  convertedLeadId: string | null;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Flagged as needing extra focus — sorts to the top of the Prospects list ahead of the normal sort order. */
  hot: boolean;
}

export interface ProspectWithRelations extends Prospect {
  activity: ProspectActivity[];
  followUps: FollowUp[];
}

/** A single logged touchpoint (call, email, meeting, or freeform note) against a prospect — structured outreach history, kept separate from lead_notes/client_notes. */
export interface ProspectActivity {
  id: string;
  prospectId: string;
  type: ProspectActivityType;
  body: string;
  createdAt: string;
  loggedByTeamMemberId: string | null;
  loggedByName: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
  /** What an hour of this person's time costs the business — used to compute labor cost on every time entry they log, billable or not. Not a billing rate; see Client.hourlyRate for what a client is charged. */
  defaultHourlyRate: string;
  active: boolean;
  createdAt: string;
  /** Null when this row is just a cost-tracking label with no login. */
  email: string | null;
  /** True once a passcode has been set for this person — they can sign in. */
  hasLogin: boolean;
  /** Explicit accent color, same palette as clients/leads — falls back to a hash-of-name color when unset. */
  color: EntityColor | null;
  /** Whether this team member can see the Partners section — owner-only by default, granted per team member (see migration 046). Always effectively true for the owner regardless of this field, which only exists on team_members rows. */
  hasPartnersAccess: boolean;
  /** Email notification preferences (see migration 048) — all default true. The owner's equivalents live on Business, not here, since the owner isn't guaranteed a linked team_members row. */
  notifyTaskAssigned: boolean;
  notifyFollowUpAssigned: boolean;
  notifyMention: boolean;
}

/**
 * A connected external calendar (Google/Outlook/Apple "secret ICS URL") — see migration 030.
 * One-way, read-only, self-managed: owned by whoever connected it, identified by
 * teamMemberId (null means the business owner's own feed, since they may not have a
 * team_members row).
 */
export interface CalendarFeed {
  id: string;
  teamMemberId: string | null;
  /** Display name of whoever connected it — the team member's name, or the business owner's name. */
  ownerName: string;
  label: string;
  feedUrl: string;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
  createdAt: string;
}

export type SessionRole = "OWNER" | "TEAM_MEMBER";

/** The signed session cookie's payload — decoded on every request, so keep it minimal. */
export interface SessionClaims {
  role: SessionRole;
  businessId: string;
  teamMemberId?: string;
}

/** Resolved current-user context for a request — the business row and (for team members) their full record are looked up once claims are verified. */
export type CurrentUser =
  | { role: "OWNER"; businessId: string; business: Business }
  | { role: "TEAM_MEMBER"; businessId: string; business: Business; teamMember: TeamMember };

export type FeedbackStatus = "new" | "planned" | "done";

/** A feature request or bug report submitted from within a workspace (Feedback page) — reviewed platform-wide from the admin dashboard. */
export interface Feedback {
  id: string;
  businessId: string;
  /** Denormalized at submission time so the record survives the submitter later being deactivated or deleted. */
  submittedByName: string;
  submittedByRole: SessionRole;
  message: string;
  status: FeedbackStatus;
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

/** A tenant workspace. Safe to pass to client components — never includes the owner passcode hash/salt or reset token. */
/** See migration 031 + src/lib/entitlements.ts. Set from the Stripe subscription's price at Checkout (see the webhook handler), or overridden manually from the platform admin portal for comped workspaces. */
export type BusinessTier = "starter" | "growth" | "scale";

/** Mirrors Stripe's own subscription statuses, narrowed to the ones we actually branch on — see the webhook handler in src/app/api/webhooks/stripe/route.ts. Null means Checkout hasn't completed yet (brand-new signup, or an abandoned one). */
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";

export type BillingInterval = "monthly" | "annual";

export interface Business {
  id: string;
  /** Workspace/company display name — set at signup, distinct from the owner's personal name. */
  name: string;
  ownerName: string;
  ownerEmail: string;
  /** Links a team_members row as the owner's own identity (e.g. one they created to track their own billable hours) — see migration 022. Assignment writes normalize a selection of this row down to the same "assigned to the owner" (null) convention used everywhere else. */
  ownerTeamMemberId: string | null;
  timezone: string;
  /** Public URL of the uploaded business logo, or null to fall back to the static /logo.png. */
  logoUrl: string | null;
  invoiceAgingUnderDays: number;
  invoiceAgingOverDays: number;
  /** Set by the platform admin portal — a suspended workspace's owner and team can no longer log in, but its data is untouched. Null means active. */
  suspendedAt: string | null;
  /** Set once the owner dismisses the first-login welcome popup — null means it hasn't been shown/dismissed yet. */
  onboardingDismissedAt: string | null;
  tier: BusinessTier;
  /** Null until Stripe Checkout completes (see createStripeCustomer in signup) — populated eagerly right after signup so the billing page/webhook always have something to key off of. */
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  /** Null means no subscription has ever been created (Checkout not completed) — written only by the Stripe webhook handler, never trusted from the client. */
  subscriptionStatus: SubscriptionStatus | null;
  /** When the 7-day trial ends — set from the Subscription object by the webhook, purely informational (Stripe itself transitions status out of 'trialing' when it passes, we don't compute this locally). */
  trialEndsAt: string | null;
  billingInterval: BillingInterval | null;
  createdAt: string;
  updatedAt: string;
  /** The owner's own email notification preferences (see migration 048) — all default true. Mirrors TeamMember's notify* fields, which cover every other recipient. */
  ownerNotifyTaskAssigned: boolean;
  ownerNotifyFollowUpAssigned: boolean;
  ownerNotifyMention: boolean;
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

/**
 * A time entry or fixed cost, normalized to one shape for the combined
 * entry log. Cost and billing are deliberately separate concepts here:
 * `cost` is what the hour actually costs the business (team member's cost
 * rate × hours — always present, whether or not the time is billable);
 * `rate`/`amount` is what the entry would be billed at, which is optional
 * and only matters once the hours are actually invoiced (see `invoiceId`).
 */
export interface CostEntry {
  id: string;
  entryType: CostEntryType;
  clientId: string | null;
  leadId: string | null;
  ownerName: string;
  date: string;
  description: string | null;
  hours: number | null;
  /** Billing rate for a time entry — optional; null means no $ value has been assigned yet. Always null for a fixed cost (use `amount` instead). */
  rate: number | null;
  billable: boolean | null;
  /** Time entries only — needed to re-select the team member when editing. */
  teamMemberId: string | null;
  teamMemberName: string | null;
  /** Work category (Admin Hours, Professional Development, ...) — time entries only. */
  workCategoryId: string | null;
  workCategoryName: string | null;
  /** Fixed-cost category (Software/Tools, Contractor, ...) — a separate concept from workCategory, fixed costs only. */
  category: FixedCostCategory | null;
  /** hours × rate for a time entry with a rate set, or the flat amount for a fixed cost. Null for a time entry with no rate assigned. */
  amount: number | null;
  /** Labor cost of this entry — hours × the team member's cost rate for a time entry (regardless of billable), or the flat amount for a fixed cost. */
  cost: number;
  /** Time entries only — set once this entry has been included on a generated invoice, so it can't be billed twice. Null means unbilled. */
  invoiceId: string | null;
  createdAt: string;
}

export interface CostRollup {
  billableHours: number;
  nonBillableHours: number;
  totalHours: number;
  /** Billable hours that haven't been attached to an invoice yet. */
  unbilledBillableHours: number;
  /** Total labor cost — every time entry's hours × its team member's cost rate, billable or not. */
  laborCost: number;
  fixedCost: number;
  totalCost: number;
}

export interface CategoryBreakdown {
  categoryId: string | null;
  /** "Uncategorized" when categoryId is null. */
  categoryName: string;
  billableHours: number;
  nonBillableHours: number;
  /** Labor cost for this category, billable or not. */
  cost: number;
}

export interface CostSummary extends CostRollup {
  /** Revenue actually invoiced for this client/lead in the filtered range — not a guess based on unbilled hours. */
  totalInvoiced: number;
  /** totalInvoiced − totalCost. */
  profit: number;
  /** Null when nothing has been invoiced yet — a percentage isn't meaningful without a denominator. */
  profitMarginPercent: number | null;
  /** totalInvoiced ÷ billable hours. Null when there are no billable hours to divide by. */
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

export const PROSPECT_STATUS_LABELS: Record<ProspectStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  ATTEMPTED: "Attempted",
  QUALIFIED: "Qualified",
  NOT_INTERESTED: "Not interested",
  CONVERTED: "Converted",
};

export const PROSPECT_STATUS_ORDER: ProspectStatus[] = [
  "NEW",
  "CONTACTED",
  "ATTEMPTED",
  "QUALIFIED",
  "NOT_INTERESTED",
  "CONVERTED",
];

export const PROSPECT_ACTIVITY_TYPE_LABELS: Record<ProspectActivityType, string> = {
  CALL: "Call",
  EMAIL: "Email",
  MEETING: "Meeting",
  NOTE: "Note",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TO_BE_DONE: "To Be Done",
  IN_PROGRESS: "In Progress",
  AWAITING_CLIENT_FEEDBACK: "Waiting on Client",
  COMPLETED: "Completed",
};

export const TASK_STATUS_ORDER: TaskStatus[] = [
  "TO_BE_DONE",
  "IN_PROGRESS",
  "AWAITING_CLIENT_FEEDBACK",
  "COMPLETED",
];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const TASK_PRIORITY_ORDER: TaskPriority[] = ["HIGH", "MEDIUM", "LOW"];

/** Labels for the three fixed system types; CUSTOM tasks use their joined todoTypeName instead. */
export const FIXED_TASK_TYPE_LABELS: Record<"CLIENT" | "LEAD" | "PARTNER", string> = {
  CLIENT: "Client",
  LEAD: "Lead",
  PARTNER: "Partner",
};

export const FOLLOWUP_STATUS_LABELS: Record<FollowUpStatus, string> = {
  UPCOMING: "Upcoming",
  COMPLETED: "Completed",
};

export const ENTITY_COLOR_ORDER: EntityColor[] = [
  "navy",
  "slate",
  "blue",
  "teal",
  "sage",
  "burnt",
  "gold",
  "brick",
  "rose",
  "violet",
];

export const ENTITY_COLOR_LABELS: Record<EntityColor, string> = {
  navy: "Navy",
  slate: "Slate",
  blue: "Blue",
  teal: "Teal",
  sage: "Sage",
  burnt: "Burnt orange",
  gold: "Gold",
  brick: "Brick",
  rose: "Rose",
  violet: "Violet",
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
