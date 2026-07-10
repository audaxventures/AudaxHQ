"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface Shot {
  src: string | null;
  alt?: string;
  filename?: string;
  label?: string;
}

export function ScreenshotGallery({ shots }: { shots: Shot[] }) {
  const [active, setActive] = useState<Shot | null>(null);

  useEffect(() => {
    if (!active) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [active]);

  return (
    <>
      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shots.map((shot, i) =>
          shot.src ? (
            <button
              key={shot.src}
              type="button"
              onClick={() => setActive(shot)}
              className="group aspect-[4/3] cursor-zoom-in overflow-hidden rounded-2xl shadow-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- real product screenshot, not a candidate for next/image in this static marketing gallery */}
              <img
                src={shot.src}
                alt={shot.alt ?? ""}
                className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
              />
            </button>
          ) : (
            <div
              key={shot.filename ?? i}
              className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-navy-200 bg-white p-6 text-center"
            >
              <span className="text-xs font-medium text-navy-400">
                {shot.label} — {shot.filename}
              </span>
            </div>
          )
        )}
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.alt}
          onClick={() => setActive(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/90 p-4 sm:p-10"
        >
          <button
            type="button"
            onClick={() => setActive(null)}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-navy-900/80 text-cream-50 transition-colors hover:bg-navy-800 sm:right-6 sm:top-6"
          >
            <X size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element -- enlarged view of the same real screenshot, not a candidate for next/image */}
          <img
            src={active.src ?? ""}
            alt={active.alt ?? ""}
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
