"use client";

import { useRef, useTransition } from "react";
import { Trash2, Plus, CheckCircle2 } from "lucide-react";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { SectionPanel } from "@/components/ui/SectionPanel";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Lead, PartnerCommission } from "@/lib/types";
import { createCommission, deleteCommission, markCommissionPaid } from "@/app/(app)/partners/actions";

function CommissionRow({
  commission,
  partnerId,
  leadNames,
  today,
}: {
  commission: PartnerCommission;
  partnerId: string;
  leadNames: Map<string, string>;
  today: string;
}) {
  const [pending, startTransition] = useTransition();
  const linkedLeadName = commission.referredLeadId ? leadNames.get(commission.referredLeadId) : null;

  return (
    <li className="flex items-start justify-between gap-3 rounded-xl px-2 py-2.5 -mx-2 hover:bg-cream-100/60">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-heading text-base text-navy-900">{formatCurrency(commission.amount)}</p>
          <Badge tone={commission.status === "PAID" ? "sage" : "gold"}>
            {commission.status === "PAID" ? "Paid" : "Owed"}
          </Badge>
        </div>
        {commission.description && <p className="mt-1 text-sm text-navy-600">{commission.description}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-navy-400">
          {linkedLeadName && <span>Referral: {linkedLeadName}</span>}
          {commission.dueDate && <span>Due {formatDate(commission.dueDate)}</span>}
          {commission.paidDate && <span>Paid {formatDate(commission.paidDate)}</span>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {commission.status === "OWED" && (
          <button
            type="button"
            title="Mark paid"
            disabled={pending}
            onClick={() => startTransition(async () => markCommissionPaid(commission.id, partnerId, today))}
            className="rounded-lg p-1.5 text-navy-300 hover:bg-sage-100 hover:text-sage-600 transition-colors cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 size={16} />
          </button>
        )}
        <button
          type="button"
          title="Delete"
          disabled={pending}
          onClick={() => startTransition(async () => deleteCommission(commission.id, partnerId))}
          className="rounded-lg p-1.5 text-navy-300 hover:bg-brick-100 hover:text-brick-600 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </li>
  );
}

export function CommissionsSection({
  partnerId,
  commissions,
  referredLeads,
  revenueGenerated,
  today,
}: {
  partnerId: string;
  commissions: PartnerCommission[];
  referredLeads: Lead[];
  /** Lifetime invoiced + paid revenue from clients this partner's WON referrals converted into — independent of commissions, since some partnerships send valuable referrals with no fee owed at all. */
  revenueGenerated: number;
  today: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const leadNames = new Map(referredLeads.map((l) => [l.id, l.companyName]));
  const boundCreate = createCommission.bind(null, partnerId);

  const owed = commissions.filter((c) => c.status === "OWED").reduce((sum, c) => sum + Number(c.amount), 0);
  const paid = commissions.filter((c) => c.status === "PAID").reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <SectionPanel eyebrow="Finance" title="Commissions" description="What's owed and paid on referrals from this partner." tone="gold">
      <div className="mb-5 grid grid-cols-3 gap-3 rounded-xl border border-navy-100 bg-cream-50 px-4 py-3">
        <div>
          <p className="font-heading text-xl font-medium text-sage-700">{formatCurrency(revenueGenerated)}</p>
          <p className="text-xs text-navy-500">Revenue generated</p>
        </div>
        <div>
          <p className="font-heading text-xl font-medium text-gold-600">{formatCurrency(owed)}</p>
          <p className="text-xs text-navy-500">Commission owed</p>
        </div>
        <div>
          <p className="font-heading text-xl font-medium text-navy-700">{formatCurrency(paid)}</p>
          <p className="text-xs text-navy-500">Commission paid</p>
        </div>
      </div>

      <h4 className="mb-2 font-heading text-base font-bold text-navy-900">Commission log</h4>
      {commissions.length === 0 ? (
        <p className="text-sm text-navy-400 mb-4">No commissions logged yet.</p>
      ) : (
        <ul className="divide-y divide-navy-100 mb-4">
          {commissions.map((c) => (
            <CommissionRow key={c.id} commission={c} partnerId={partnerId} leadNames={leadNames} today={today} />
          ))}
        </ul>
      )}

      <form
        ref={formRef}
        action={(formData) => {
          startTransition(async () => {
            await boundCreate(formData);
          });
          formRef.current?.reset();
        }}
        className={cn("space-y-2 border-t border-navy-100 pt-4", pending && "opacity-60")}
      >
        <div className="grid grid-cols-2 gap-2">
          <Input name="amount" type="number" step="0.01" min="0" placeholder="Amount" required />
          <Select name="status" defaultValue="OWED">
            <option value="OWED">Owed</option>
            <option value="PAID">Paid</option>
          </Select>
        </div>
        {referredLeads.length > 0 && (
          <Select name="referredLeadId" defaultValue="">
            <option value="">No linked referral</option>
            {referredLeads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.companyName}
              </option>
            ))}
          </Select>
        )}
        <Textarea name="description" rows={2} placeholder="What's this for…" />
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-medium text-navy-500">
            Due date
            <Input name="dueDate" type="date" className="mt-1" />
          </label>
          <label className="text-xs font-medium text-navy-500">
            Paid date
            <Input name="paidDate" type="date" className="mt-1" />
          </label>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-navy-900 px-3.5 py-2 text-sm font-medium text-cream-50 hover:bg-navy-800 cursor-pointer transition-colors disabled:opacity-50"
        >
          <Plus size={16} /> Add commission
        </button>
      </form>
    </SectionPanel>
  );
}
