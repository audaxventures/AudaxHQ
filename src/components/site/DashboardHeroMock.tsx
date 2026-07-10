"use client";

import { motion } from "framer-motion";

/**
 * A real screenshot of the product (a sample "NorthBridge Consulting"
 * workspace) — not a synthetic recreation. Shown at its full, uncropped
 * aspect ratio so the sidebar and stat cards never get clipped.
 */
export function DashboardHeroMock() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate: -1.5 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="w-full overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- real product screenshot, not a candidate for next/image in this static marketing card */}
      <img
        src="/demodashboardweb.png"
        alt="AudaxHQ dashboard showing revenue, to-dos, clients, and follow-ups at a glance"
        className="block h-auto w-full"
      />
    </motion.div>
  );
}
