"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface FeatureDetail {
  /** Pre-rendered at the two sizes this component needs — a Server Component can't pass a bare icon component reference to a Client Component, only already-rendered JSX. */
  iconSmall: React.ReactNode;
  iconLarge: React.ReactNode;
  title: string;
  tone: string;
  /** One line shown under the title in the left-hand list. */
  summary: string;
  /** Longer paragraph shown in the detail panel. */
  description: string;
  capabilities: string[];
  image?: string;
  imageAlt?: string;
}

const TONE_CHIP: Record<string, string> = {
  sage: "bg-sage-100 text-sage-600",
  gold: "bg-gold-100 text-gold-600",
  blue: "bg-blue-100 text-blue-600",
  violet: "bg-violet-100 text-violet-600",
  teal: "bg-teal-100 text-teal-600",
  brick: "bg-brick-100 text-brick-600",
  slate: "bg-slate-100 text-slate-600",
  rose: "bg-rose-100 text-rose-600",
};

const TONE_PANEL: Record<string, string> = {
  sage: "from-sage-100 to-white text-sage-600",
  gold: "from-gold-100 to-white text-gold-600",
  blue: "from-blue-100 to-white text-blue-600",
  violet: "from-violet-100 to-white text-violet-600",
  teal: "from-teal-100 to-white text-teal-600",
  brick: "from-brick-100 to-white text-brick-600",
  slate: "from-slate-100 to-white text-slate-600",
  rose: "from-rose-100 to-white text-rose-600",
};

/** Click a feature on the left to see its detail panel on the right — About page's feature deep-dive. */
export function FeatureExplorer({ features }: { features: FeatureDetail[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = features[activeIndex];

  return (
    <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,300px)_1fr] lg:gap-10">
      <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:pb-0">
        {features.map((f, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={f.title}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors lg:shrink",
                isActive ? "border-navy-200 bg-white shadow-sm" : "border-transparent hover:bg-white/70"
              )}
            >
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", TONE_CHIP[f.tone])}>
                {f.iconSmall}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block whitespace-nowrap text-sm font-semibold lg:whitespace-normal",
                    isActive ? "text-navy-900" : "text-navy-600"
                  )}
                >
                  {f.title}
                </span>
                <span className="hidden text-xs text-navy-400 lg:block">{f.summary}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div key={activeIndex} className="motion-safe:animate-feature-panel-in rounded-2xl border border-navy-100 bg-white p-6 sm:p-8">
        {active.image ? (
          <div className="aspect-[16/9] overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element -- swapped per feature click, not a fixed layout image */}
            <img src={active.image} alt={active.imageAlt ?? ""} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className={cn("flex aspect-[16/9] items-center justify-center rounded-xl bg-gradient-to-br", TONE_PANEL[active.tone])}>
            {active.iconLarge}
          </div>
        )}
        <span className={cn("mt-6 inline-flex h-10 w-10 items-center justify-center rounded-lg", TONE_CHIP[active.tone])}>
          {active.iconSmall}
        </span>
        <h3 className="mt-3 font-heading text-2xl font-semibold text-navy-900">{active.title}</h3>
        <p className="mt-3 text-base leading-relaxed text-navy-600">{active.description}</p>
        <ul className="mt-6 space-y-3">
          {active.capabilities.map((c) => (
            <li key={c} className="flex items-start gap-2.5 text-sm leading-relaxed text-navy-600">
              <Check size={16} className="mt-0.5 shrink-0 text-sage-600" />
              {c}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
