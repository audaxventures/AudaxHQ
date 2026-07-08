"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { formatDate } from "@/lib/format";
import type { Lead } from "@/lib/types";

export function ConvertedLeadsDrawer({ leads }: { leads: Lead[] }) {
  const [open, setOpen] = useState(false);

  if (leads.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 transition-colors hover:text-navy-700 cursor-pointer"
      >
        <CheckCircle2 size={16} className="text-sage-600" />
        Converted ({leads.length})
      </button>
      {open && (
        <Drawer
          onClose={() => setOpen(false)}
          title="Converted leads"
          description="These won leads are now clients — manage them from the Clients page."
        >
          <div className="space-y-2">
            {leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/clients/${lead.convertedClientId}`}
                className="group flex items-center gap-3 rounded-xl border border-navy-100 px-3 py-2.5 transition-colors hover:bg-cream-100/60"
              >
                <AvatarChip name={lead.companyName} color={lead.color} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-navy-900">{lead.companyName}</p>
                  <p className="text-xs text-navy-400">Converted {formatDate(lead.updatedAt)}</p>
                </div>
                <ArrowUpRight
                  size={16}
                  className="shrink-0 text-navy-300 transition-colors group-hover:text-navy-600"
                />
              </Link>
            ))}
          </div>
        </Drawer>
      )}
    </>
  );
}
