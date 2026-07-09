"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-navy-100 rounded-2xl border border-navy-100 bg-white">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${i}`}
              className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <span className="font-heading text-base font-medium text-navy-900">{item.question}</span>
              <ChevronDown
                size={18}
                className={cn("shrink-0 text-navy-400 transition-transform duration-200", isOpen && "rotate-180")}
              />
            </button>
            <div
              id={`faq-panel-${i}`}
              className={cn(
                "grid overflow-hidden transition-[grid-template-rows] duration-300",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-5 text-sm leading-relaxed text-navy-600">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
