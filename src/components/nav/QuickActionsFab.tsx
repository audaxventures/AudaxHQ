"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Clock, NotebookPen, Plus, UserPlus, CheckSquare, X } from "lucide-react";
import { cn } from "@/lib/cn";

const QUICK_ACTIONS = [
  { href: "/leads/new", label: "New Lead", icon: UserPlus, iconClasses: "bg-navy-100 text-navy-700" },
  { href: "/clients/new", label: "New Client", icon: Building2, iconClasses: "bg-sage-100 text-sage-600" },
  { href: "/todos", label: "Add To-Do", icon: CheckSquare, iconClasses: "bg-burnt-100 text-burnt-600" },
  { href: "/tracker", label: "Log Time", icon: Clock, iconClasses: "bg-blue-100 text-blue-600" },
  { href: "/meeting-notes/new", label: "Create Meeting Note", icon: NotebookPen, iconClasses: "bg-gold-100 text-gold-600" },
];

/** Only ever rendered while open — the caller conditionally mounts it. */
function QuickActionsSheet({ onClose }: { onClose: () => void }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true));
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className={cn(
          "absolute inset-0 bg-navy-950/40 transition-opacity duration-300",
          show ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 rounded-t-3xl bg-white px-5 pt-3 shadow-2xl transition-transform duration-300 ease-out",
          show ? "translate-y-0" : "translate-y-full"
        )}
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-navy-200" />
        <h2 className="mb-3 text-center font-heading text-lg font-medium text-navy-900">Quick Actions</h2>
        <div className="space-y-1">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-2 py-3 text-sm font-medium text-navy-800 transition-colors hover:bg-navy-100/60"
            >
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", action.iconClasses)}>
                <action.icon size={17} />
              </span>
              {action.label}
            </Link>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="mx-auto mt-3 flex h-10 w-10 items-center justify-center rounded-full border border-navy-200 text-navy-400 hover:text-navy-700 cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

export function QuickActionsFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Quick actions"
        className="fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-burnt-500 text-cream-50 shadow-lg shadow-burnt-900/30 transition-transform hover:bg-burnt-600 active:scale-95 md:hidden cursor-pointer"
      >
        <Plus size={26} />
      </button>

      {open && <QuickActionsSheet onClose={() => setOpen(false)} />}
    </>
  );
}
