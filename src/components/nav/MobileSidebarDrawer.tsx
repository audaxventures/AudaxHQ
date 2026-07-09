"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { SidebarNavList } from "@/components/nav/SidebarNavList";
import type { SessionRole } from "@/lib/types";

/** Only ever rendered while open — the caller conditionally mounts it (`{drawerOpen && <MobileSidebarDrawer .../>}`). */
export function MobileSidebarDrawer({
  role,
  isAdmin,
  businessName,
  onClose,
}: {
  role: SessionRole;
  isAdmin?: boolean;
  businessName: string;
  onClose: () => void;
}) {
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
          "absolute inset-0 bg-navy-950/50 transition-opacity duration-300",
          show ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          "absolute inset-y-0 left-0 flex w-full max-w-[280px] flex-col overflow-y-auto bg-navy-900 bg-cover bg-center px-4 py-6 shadow-2xl transition-transform duration-300 ease-out",
          show ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ backgroundImage: "url('/sidebar.png')" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,20,36,0.45) 0%, rgba(10,20,36,0.55) 45%, rgba(10,20,36,0.82) 100%)",
          }}
        />
        <div className="relative mb-6 flex shrink-0 items-start justify-between border-b border-navy-800/60 pb-5">
          <div className="min-w-0">
            <p className="truncate font-heading text-2xl font-semibold text-cream-100 leading-tight" title={businessName}>
              {businessName}
            </p>
            <p className="mt-1.5 text-xs italic text-burnt-400">Your business command centre</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-navy-400 transition-colors hover:text-cream-100 cursor-pointer"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <SidebarNavList role={role} isAdmin={isAdmin} onNavigate={onClose} />
      </div>
    </div>
  );
}
