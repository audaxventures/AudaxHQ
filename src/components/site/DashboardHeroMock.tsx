"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";

/**
 * A real screenshot of the product (a sample "NorthBridge Consulting"
 * workspace), framed like a browser window — not a synthetic recreation.
 */
export function DashboardHeroMock() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate: -1.5 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="w-full overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
    >
      <div className="flex items-center gap-2 bg-navy-950 px-4 py-2.5">
        <Lock size={11} className="text-navy-400" />
        <span className="font-mono text-[11px] text-navy-300">app.audaxhq.ca</span>
      </div>
      <div className="aspect-[16/11] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- real product screenshot, not a candidate for next/image in this static marketing card */}
        <img
          src="/demodashboardweb.png"
          alt="AudaxHQ dashboard showing revenue, to-dos, clients, and follow-ups at a glance"
          className="h-full w-full object-cover object-top"
        />
      </div>
    </motion.div>
  );
}
