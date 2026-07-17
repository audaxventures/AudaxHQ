"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * The etymology, shown by construction rather than explained in prose: "Ver"
 * and "clara" render in the same two colors as the gloss legend below them,
 * so the color-coding does the work of tying word to meaning. Splitting the
 * wordmark by color is a deliberate one-off for this section only — every
 * other wordmark on the site (nav, footer, emails, OG image) renders
 * "Verclara" as a single color, since the name doesn't split into two parts
 * anywhere else. Here it's the whole point.
 */
export function WhyVerclaraWordmark() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col items-center">
      <div className="flex font-heading text-6xl font-semibold tracking-tight sm:text-7xl lg:text-8xl">
        <motion.span
          initial={{ opacity: 0, x: reduceMotion ? 0 : -36 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="text-cream-50"
        >
          Ver
        </motion.span>
        <motion.span
          initial={{ opacity: 0, x: reduceMotion ? 0 : 36 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="text-burnt-400"
        >
          clara
        </motion.span>
      </div>
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, delay: reduceMotion ? 0 : 0.35, ease: EASE }}
        className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cream-50" aria-hidden />
          <span className="text-sm text-navy-300">
            <span className="font-semibold text-cream-100">ver</span> — truth{" "}
            <span className="text-navy-400">(Latin)</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-burnt-400" aria-hidden />
          <span className="text-sm text-navy-300">
            <span className="font-semibold text-burnt-300">clara</span> — clear, bright{" "}
            <span className="text-navy-400">(Latin)</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}
