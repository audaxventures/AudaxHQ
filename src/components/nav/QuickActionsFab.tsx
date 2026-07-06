"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useDragControls, type PanInfo } from "framer-motion";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { MOBILE_QUICK_ACTIONS } from "@/lib/quickActions";

/** Only ever rendered while open — the caller conditionally mounts it. */
function QuickActionsSheet({ onClose }: { onClose: () => void }) {
  const dragControls = useDragControls();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > 80 || info.velocity.y > 500) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <motion.div
        className="absolute inset-0 bg-navy-950/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        drag="y"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={handleDragEnd}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white px-5 pt-3 shadow-2xl"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        {/* Drag handle — the only part that starts the swipe-to-close gesture, so links below stay tap-friendly. */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="mx-auto mb-4 h-1.5 w-10 touch-none rounded-full bg-navy-200 cursor-grab active:cursor-grabbing"
        />
        <h2 className="mb-3 text-center font-heading text-lg font-medium text-navy-900">Quick Actions</h2>
        <div className="space-y-1">
          {MOBILE_QUICK_ACTIONS.map((action) => (
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
      </motion.div>
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

      <AnimatePresence>{open && <QuickActionsSheet onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}
