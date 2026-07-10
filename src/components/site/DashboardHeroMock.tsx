"use client";

import { motion } from "framer-motion";

/**
 * A real photo of the product (a sample "NorthBridge Consulting" workspace
 * open on a laptop) — the photo already has its own bezel, so no synthetic
 * device frame is added around it, just a soft glow behind it.
 */
export function DashboardHeroMock() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-10 rounded-full bg-burnt-500/35 blur-[100px]"
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-2xl"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- real product photo, not a candidate for next/image in this static marketing card */}
        <img
          src="/herodashboardlaptop.png"
          alt="AudaxHQ dashboard open on a laptop, showing revenue, to-dos, clients, and follow-ups at a glance"
          className="block h-auto w-full"
        />
      </motion.div>
    </div>
  );
}
