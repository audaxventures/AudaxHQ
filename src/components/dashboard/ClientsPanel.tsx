"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Client } from "@/lib/types";

const MAX_VISIBLE_CLIENTS = 3;

function TabPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer",
        active
          ? "border-navy-900 bg-navy-900 text-cream-50"
          : "border-navy-200 bg-transparent text-navy-600 hover:border-navy-400"
      )}
    >
      {children}
    </button>
  );
}

export function ClientsPanel({
  recurringClients,
  projectClients,
}: {
  recurringClients: Client[];
  projectClients: Client[];
}) {
  const [tab, setTab] = useState<"RECURRING" | "PROJECT">("RECURRING");
  const clients = tab === "RECURRING" ? recurringClients : projectClients;
  const totalActive = recurringClients.length + projectClients.length;
  const visibleClients = clients.slice(0, MAX_VISIBLE_CLIENTS);
  const emptySlots = MAX_VISIBLE_CLIENTS - visibleClients.length;

  return (
    <Card tone="slate" className="p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-slate-100 text-slate-600">
            <Users size={14} />
          </div>
          <h3 className="font-heading text-base font-medium text-navy-900">
            Clients <span className="font-sans text-xs font-normal text-navy-400">({totalActive} active)</span>
          </h3>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <TabPill active={tab === "RECURRING"} onClick={() => setTab("RECURRING")}>
            Monthly Recurring
          </TabPill>
          <TabPill active={tab === "PROJECT"} onClick={() => setTab("PROJECT")}>
            Project
          </TabPill>
        </div>
      </div>

      <div>
        <ul className="divide-y divide-navy-100 -mx-1">
          {visibleClients.length === 0 ? (
            <li className="flex items-center gap-3 rounded-lg px-1 py-2.5">
              <p className="text-sm text-navy-400">
                No active {tab === "RECURRING" ? "recurring" : "project"} clients
              </p>
            </li>
          ) : (
            visibleClients.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/clients/${c.id}`}
                  className="flex items-center gap-3 rounded-lg px-1 py-2.5 transition-colors hover:bg-cream-100/60"
                >
                  <AvatarChip name={c.companyName} color={c.color} />
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-navy-900">{c.companyName}</p>
                  <span className="shrink-0 text-xs font-medium text-navy-500">
                    {formatCurrency(c.rate)}
                    {tab === "RECURRING" ? "/mo" : ""}
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
        {/* Invisible filler rows (outside the divide-y list, so no stray divider lines) so the card doesn't resize when a tab has fewer than MAX_VISIBLE_CLIENTS clients. */}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div key={`filler-${i}`} aria-hidden className="invisible flex items-center gap-3 rounded-lg px-1 py-2.5">
            <span className="h-8 w-8 shrink-0 rounded-[10px]" />
            <span className="min-w-0 flex-1 text-sm">filler</span>
          </div>
        ))}
      </div>

      <Link
        href="/clients"
        className="mt-3 inline-flex items-center gap-1 px-1 text-xs font-medium text-burnt-600 hover:underline"
      >
        View all clients <ArrowRight size={12} />
      </Link>
    </Card>
  );
}
