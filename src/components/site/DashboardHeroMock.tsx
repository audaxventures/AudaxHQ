"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * A real screenshot of the product (a sample "NorthBridge Consulting"
 * workspace dashboard) — tilted in 3D space and given a deep ambient shadow
 * so a flat screenshot reads as a floating panel rather than a static
 * image, then bleeds past the section's max-width on larger screens so it
 * carries real visual weight against the navy hero background.
 */
export function DashboardHeroMock() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative lg:-mr-10 lg:w-[112%] xl:-mr-28 xl:w-[136%]">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-16 rounded-full bg-burnt-500/35 blur-[110px]"
      />
      <motion.div
        initial={{ opacity: 0, y: 16, rotateY: reduceMotion ? 0 : 26, rotateX: reduceMotion ? 0 : 7 }}
        animate={{ opacity: 1, y: 0, rotateY: 20, rotateX: 5 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        whileHover={reduceMotion ? undefined : { rotateY: 14, rotateX: 3, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
        style={{ perspective: 1600, transformStyle: "preserve-3d" }}
        className="relative"
      >
        <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-[0_60px_120px_-24px_rgba(0,0,0,0.7)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- real product screenshot, not a candidate for next/image in this static marketing card */}
          <img
            src="/demodashboardweb.png"
            alt="AudaxHQ dashboard for NorthBridge Consulting, showing projected revenue, to-dos, clients, and follow-ups at a glance"
            className="block h-auto w-full"
          />
        </div>
      </motion.div>
    </div>
  );
}
