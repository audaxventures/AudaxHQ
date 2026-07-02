import { cn } from "@/lib/cn";
import type {
  ClientStatus,
  InvoiceStatus,
  LeadStatus,
  TodoStatus,
} from "@/lib/types";

type Tone = "sage" | "gold" | "brick" | "slate" | "burnt" | "navy";

const TONE_CLASSES: Record<Tone, string> = {
  sage: "bg-sage-100 text-sage-600",
  gold: "bg-gold-100 text-gold-600",
  brick: "bg-brick-100 text-brick-600",
  slate: "bg-slate-100 text-slate-600",
  burnt: "bg-burnt-100 text-burnt-600",
  navy: "bg-navy-100 text-navy-700",
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
  CHURNED: "brick",
};

const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  CHURNED: "Churned",
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

export function TodoStatusBadge({ status }: { status: TodoStatus }) {
  return status === "DONE" ? (
    <Badge tone="sage">Done</Badge>
  ) : (
    <Badge tone="slate">Open</Badge>
  );
}
