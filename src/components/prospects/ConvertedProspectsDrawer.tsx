"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { formatDate } from "@/lib/format";
import type { Prospect } from "@/lib/types";

export function ConvertedProspectsDrawer({ prospects }: { prospects: Prospect[] }) {
  const [open, setOpen] = useState(false);

  if (prospects.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 transition-colors hover:text-navy-700 cursor-pointer"
      >
        <CheckCircle2 size={16} className="text-sage-600" />
        Converted ({prospects.length})
      </button>
      {open && (
        <Drawer
          onClose={() => setOpen(false)}
          title="Converted prospects"
          description="These prospects are now leads — manage them from the Leads page."
        >
          <div className="space-y-2">
            {prospects.map((prospect) => (
              <Link
                key={prospect.id}
                href={`/leads/${prospect.convertedLeadId}`}
                className="group flex items-center gap-3 rounded-xl border border-navy-100 px-3 py-2.5 transition-colors hover:bg-cream-100/60"
              >
                <AvatarChip name={prospect.businessName || prospect.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-navy-900">
                    {prospect.businessName || prospect.name}
                  </p>
                  <p className="text-xs text-navy-400">Converted {formatDate(prospect.updatedAt)}</p>
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
