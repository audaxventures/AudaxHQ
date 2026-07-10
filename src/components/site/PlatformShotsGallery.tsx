"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface Shot {
  src: string;
  alt: string;
}

export function PlatformShotsGallery({ shots }: { shots: Shot[] }) {
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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
        {shots.map((shot) => (
          <button
            key={shot.src}
            type="button"
            onClick={() => setActive(shot)}
            className="group aspect-[3/4] cursor-zoom-in overflow-hidden rounded-xl shadow-lg"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- real product photo, not a candidate for next/image in this static marketing grid */}
            <img
              src={shot.src}
              alt={shot.alt}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </button>
        ))}
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
            src={active.src}
            alt={active.alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
