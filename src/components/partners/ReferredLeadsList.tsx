import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { LeadStatusBadge } from "@/components/ui/Badge";
import { SectionPanel } from "@/components/ui/SectionPanel";
import { formatCurrency } from "@/lib/format";
import type { Lead } from "@/lib/types";

export function ReferredLeadsList({ leads }: { leads: Lead[] }) {
  return (
    <SectionPanel eyebrow="Referrals" title="Leads sent this way" description="Every lead this partner has referred, most recent first." tone="sage">
      {leads.length === 0 ? (
        <p className="text-sm text-navy-400">No referrals from this partner yet.</p>
      ) : (
        <ul className="space-y-2">
          {leads.map((lead) => (
            <li key={lead.id}>
              <Link
                href={lead.convertedClientId ? `/clients/${lead.convertedClientId}` : `/leads/${lead.id}`}
                className="group flex items-center gap-3 rounded-xl px-2 py-2 -mx-2 hover:bg-cream-100/60 transition-colors"
              >
                <AvatarChip name={lead.companyName} color={lead.color} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-navy-900 truncate">{lead.companyName}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <LeadStatusBadge status={lead.status} />
                    {lead.convertedClientId && (
                      <span className="text-xs font-medium text-sage-600">Converted to client</span>
                    )}
                  </div>
                </div>
                {lead.estimatedValue && (
                  <span className="shrink-0 text-sm font-medium text-navy-700">{formatCurrency(lead.estimatedValue)}</span>
                )}
                <ChevronRight size={16} className="shrink-0 text-navy-300 group-hover:text-navy-500 transition-colors" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionPanel>
  );
}
