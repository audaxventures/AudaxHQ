"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { SidebarNavList } from "@/components/nav/SidebarNavList";
import type { SessionRole } from "@/lib/types";

/** Only ever rendered while open — the caller conditionally mounts it (`{drawerOpen && <MobileSidebarDrawer .../>}`). */
export function MobileSidebarDrawer({ role, onClose }: { role: SessionRole; onClose: () => void }) {
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
          "absolute inset-y-0 left-0 flex w-full max-w-[280px] flex-col overflow-y-auto bg-gradient-to-b from-navy-900 to-navy-950 px-4 py-6 shadow-2xl transition-transform duration-300 ease-out",
          show ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(120% 60% at 50% 0%, rgba(214,122,60,0.16), transparent 60%)",
          }}
        />
        <div className="relative mb-6 flex shrink-0 items-center justify-between border-b border-navy-800/60 pb-5">
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded logo, dimensions unknown */}
          <img src="/logo.white.png" alt="Audax Ventures" className="h-9 w-auto" />
          <button
            type="button"
            onClick={onClose}
            className="text-navy-400 transition-colors hover:text-cream-100 cursor-pointer"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <SidebarNavList role={role} onNavigate={onClose} />
      </div>
    </div>
  );
}
