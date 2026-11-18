"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Archive } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { formatDate } from "@/lib/format";
import { LEAD_STATUS_LABELS, type Lead } from "@/lib/types";

export function ArchivedLeadsDrawer({ leads }: { leads: Lead[] }) {
  const [open, setOpen] = useState(false);

  if (leads.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 transition-colors hover:text-navy-700 cursor-pointer"
      >
        <Archive size={16} className="text-navy-400" />
        Archived ({leads.length})
      </button>
      {open && (
        <Drawer
          onClose={() => setOpen(false)}
          title="Archived leads"
          description="Shelved for later. Open one and hit Unarchive to put it back in your pipeline at the stage you left it."
        >
          <div className="space-y-2">
            {leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="group flex items-center gap-3 rounded-xl border border-navy-100 px-3 py-2.5 transition-colors hover:bg-cream-100/60"
              >
                <AvatarChip name={lead.companyName} color={lead.color} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-navy-900">{lead.companyName}</p>
                  <p className="text-xs text-navy-400">{LEAD_STATUS_LABELS[lead.status]} · Archived {formatDate(lead.archivedAt ?? lead.updatedAt)}</p>
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
