import { cn } from "@/lib/cn";
import type {
  ClientStatus,
  FeedbackStatus,
  FollowUpStatus,
  InvoiceAgeBracket,
  InvoiceStatus,
  LeadStatus,
  TaskStatus,
  TaskType,
} from "@/lib/types";
import { TASK_STATUS_LABELS, FIXED_TASK_TYPE_LABELS } from "@/lib/types";

export type Tone = "sage" | "gold" | "brick" | "slate" | "burnt" | "navy" | "blue" | "violet";

export const TONE_CLASSES: Record<Tone, string> = {
  sage: "bg-sage-100 text-sage-600",
  gold: "bg-gold-100 text-gold-600",
  brick: "bg-brick-100 text-brick-600",
  slate: "bg-slate-100 text-slate-600",
  burnt: "bg-burnt-100 text-burnt-600",
  navy: "bg-navy-100 text-navy-700",
  blue: "bg-blue-100 text-blue-600",
  violet: "bg-violet-100 text-violet-600",
};

export function Badge({
  tone = "slate",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tracking-wide whitespace-nowrap",
        TONE_CLASSES[tone],
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}

const CLIENT_STATUS_TONE: Record<ClientStatus, Tone> = {
  ACTIVE: "sage",
  PAUSED: "gold",
  CHURNED: "slate",
};

const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  CHURNED: "Archived",
};

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return <Badge tone={CLIENT_STATUS_TONE[status]}>{CLIENT_STATUS_LABEL[status]}</Badge>;
}

const INVOICE_STATUS_TONE: Record<InvoiceStatus, Tone> = {
  NOT_INVOICED: "slate",
  INVOICED: "gold",
  PAID: "sage",
};

const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  NOT_INVOICED: "Not invoiced",
  INVOICED: "Invoiced",
  PAID: "Paid",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge tone={INVOICE_STATUS_TONE[status]}>{INVOICE_STATUS_LABEL[status]}</Badge>;
}

const LEAD_STATUS_TONE: Record<LeadStatus, Tone> = {
  NEW: "slate",
  CONTACTED: "navy",
  PROPOSAL_SENT: "burnt",
  NEGOTIATING: "gold",
  WON: "sage",
  LOST: "brick",
};

const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  PROPOSAL_SENT: "Proposal sent",
  NEGOTIATING: "Negotiating",
  WON: "Won",
  LOST: "Lost",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return <Badge tone={LEAD_STATUS_TONE[status]}>{LEAD_STATUS_LABEL[status]}</Badge>;
}

export const TASK_STATUS_TONE: Record<TaskStatus, Tone> = {
  TO_BE_DONE: "burnt",
  IN_PROGRESS: "blue",
  AWAITING_CLIENT_FEEDBACK: "gold",
  COMPLETED: "sage",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge tone={TASK_STATUS_TONE[status]}>{TASK_STATUS_LABELS[status]}</Badge>;
}

const TASK_TYPE_TONE: Record<TaskType, Tone> = {
  CLIENT: "sage",
  LEAD: "violet",
  CUSTOM: "slate",
};

export function TaskTypeBadge({ type, todoTypeName }: { type: TaskType; todoTypeName?: string | null }) {
  const label = type === "CUSTOM" ? todoTypeName ?? "Other" : FIXED_TASK_TYPE_LABELS[type];
  return <Badge tone={TASK_TYPE_TONE[type]}>{label}</Badge>;
}

export function FollowUpStatusBadge({ status }: { status: FollowUpStatus }) {
  return status === "COMPLETED" ? (
    <Badge tone="sage">Completed</Badge>
  ) : (
    <Badge tone="slate">Upcoming</Badge>
  );
}

const INVOICE_AGE_BRACKET_TONE: Record<InvoiceAgeBracket, Tone> = {
  UNDER_15: "sage",
  DAYS_15_30: "gold",
  OVER_30: "brick",
};

export function InvoiceAgeBracketBadge({ bracket, label }: { bracket: InvoiceAgeBracket; label: string }) {
  return <Badge tone={INVOICE_AGE_BRACKET_TONE[bracket]}>{label}</Badge>;
}

const FEEDBACK_STATUS_TONE: Record<FeedbackStatus, Tone> = {
  new: "slate",
  planned: "gold",
  done: "sage",
};

const FEEDBACK_STATUS_LABEL: Record<FeedbackStatus, string> = {
  new: "New",
  planned: "Planned",
  done: "Done",
};

export function FeedbackStatusBadge({ status }: { status: FeedbackStatus }) {
  return <Badge tone={FEEDBACK_STATUS_TONE[status]}>{FEEDBACK_STATUS_LABEL[status]}</Badge>;
}
