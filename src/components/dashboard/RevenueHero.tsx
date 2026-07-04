"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { formatCurrency } from "@/lib/format";

const SPARK_WIDTH = 220;
const SPARK_HEIGHT = 64;
const SPARK_PAD_X = 4;
// Extra top padding reserves room for the endpoint value label so it never
// escapes above the viewBox when the last point is near the series max.
const SPARK_PAD_TOP = 18;
const SPARK_PAD_BOTTOM = 4;

function sparkPoints(values: number[]) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = (SPARK_WIDTH - SPARK_PAD_X * 2) / (values.length - 1 || 1);
  return values.map((v, i) => ({
    x: SPARK_PAD_X + i * stepX,
    y:
      SPARK_PAD_TOP +
      (1 - (v - min) / range) * (SPARK_HEIGHT - SPARK_PAD_TOP - SPARK_PAD_BOTTOM),
  }));
}

export function RevenueHero({
  revenue,
  weeklyRevenue,
  activeClientCount,
}: {
  revenue: number;
  weeklyRevenue: number[];
  activeClientCount: number;
}) {
  const reduce = useReducedMotion();
  const count = useMotionValue(reduce ? revenue : 0);
  const display = useTransform(count, (v) => formatCurrency(Math.round(v)));

  useEffect(() => {
    if (reduce) {
      count.set(revenue);
      return;
    }
    const controls = animate(count, revenue, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [revenue, reduce, count]);

  const points = sparkPoints(weeklyRevenue);
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const last = points[points.length - 1];
  const areaPath = `${linePath} L${last.x},${SPARK_HEIGHT} L${points[0].x},${SPARK_HEIGHT} Z`;
  const lastValue = weeklyRevenue[weeklyRevenue.length - 1] ?? 0;

  return (
    <section className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-navy-900 to-navy-950 p-7 text-cream-50 sm:p-8">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(120% 140% at 100% 0%, rgba(214,122,60,0.22), transparent 55%)",
        }}
      />
      <div className="relative grid grid-cols-1 items-center gap-7 md:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-sage-100/80">
            Projected revenue
          </p>
          <motion.p className="font-heading text-4xl leading-none tabular-nums sm:text-5xl">
            {display}
          </motion.p>
          <p className="mt-3 max-w-[38ch] text-sm text-navy-300">
            Recurring fees plus unpaid project work across {activeClientCount} active client
            {activeClientCount === 1 ? "" : "s"}.
          </p>
          <Link
            href="/invoices"
            className="mt-4 inline-flex items-center gap-1.5 rounded-[10px] border border-burnt-400/40 px-3.5 py-2 text-[13px] font-semibold text-burnt-400 transition-colors hover:border-burnt-400 hover:bg-burnt-400/10"
          >
            View invoice aging <ArrowRight size={14} />
          </Link>
        </div>
        <div className="text-right">
          <p className="mb-2 text-[11px] text-navy-300">Collected, trailing 8 weeks</p>
          <svg viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`} className="h-16 w-full overflow-visible">
            <defs>
              <linearGradient id="revSparkFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d67a3c" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#d67a3c" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path
              d={areaPath}
              fill="url(#revSparkFill)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: reduce ? 0 : 0.9 }}
            />
            <motion.path
              d={linePath}
              fill="none"
              stroke="#d67a3c"
              strokeWidth={2.25}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduce ? 0 : 1.1, delay: reduce ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            />
            <motion.circle
              cx={last.x}
              cy={last.y}
              r={3.5}
              fill="#d67a3c"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: reduce ? 0 : 1.3 }}
            />
            <motion.text
              x={last.x - 4}
              y={last.y - 10}
              textAnchor="end"
              className="font-heading"
              fontSize={12}
              fill="#fdfbf6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: reduce ? 0 : 1.4 }}
            >
              {formatCurrency(lastValue)}
            </motion.text>
          </svg>
        </div>
      </div>
    </section>
  );
}
