"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {title && (
          <div className="flex shrink-0 items-center justify-between border-b border-navy-100 px-6 py-4">
            <h2 className="font-heading text-lg font-medium text-navy-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-navy-400 transition-colors hover:text-navy-700 cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
