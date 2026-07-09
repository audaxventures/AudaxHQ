"use client";

import { useEffect, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  Calendar,
  CheckSquare,
  Clock,
  LayoutDashboard,
  Lock,
  NotebookPen,
  Receipt,
  Settings,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

const NAV_ICONS = [LayoutDashboard, Users, Target, BarChart3, NotebookPen, Calendar, Receipt, Clock, CheckSquare, Settings];

function useCountUp(target: number, delay = 0) {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? target : 0);

  useEffect(() => {
    if (reduce) return;
    const timeout = setTimeout(() => {
      const controls = animate(0, target, {
        duration: 1.3,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: setValue,
      });
      return () => controls.stop();
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, delay, reduce]);

  return value;
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  iconClass,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  detail: string;
  iconClass: string;
  delay: number;
  prefix?: string;
}) {
  const count = useCountUp(value, delay);
  return (
    <div className="rounded-xl border border-navy-100 bg-white p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-navy-400">{label}</p>
        <span className={`flex h-6 w-6 items-center justify-center rounded-full ${iconClass}`}>
          <Icon size={12} />
        </span>
      </div>
      <p className="mt-1.5 font-heading text-xl font-semibold text-navy-900 tabular-nums">
        {Math.round(count).toLocaleString()}
      </p>
      <p className="mt-0.5 text-[11px] text-navy-400">{detail}</p>
    </div>
  );
}

/**
 * A live-coded recreation of the real dashboard (same nav icon set as
 * src/components/nav/NavLink.tsx, same stat-tile language as the real
 * dashboard page) rather than a screenshot — resolution-independent and can
 * actually animate, which is the point: this is what the product looks
 * like, not a picture of it.
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
      <div className="flex">
        <div className="flex w-12 shrink-0 flex-col items-center gap-1 bg-navy-900 py-3 sm:w-14">
          {NAV_ICONS.map((Icon, i) => (
            <span
              key={i}
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                i === 0 ? "bg-navy-800 text-burnt-400" : "text-navy-400"
              }`}
            >
              <Icon size={15} />
            </span>
          ))}
        </div>
        <div className="flex-1 bg-cream-50 p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <h3 className="font-heading text-sm font-semibold text-navy-900">Dashboard</h3>
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-600 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sage-600" />
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <StatCard
              icon={TrendingUp}
              label="Revenue this month"
              value={66925}
              detail="+12% vs last month"
              iconClass="bg-sage-100 text-sage-600"
              delay={0}
            />
            <StatCard
              icon={CheckSquare}
              label="Open to-dos"
              value={12}
              detail="3 due this week"
              iconClass="bg-burnt-100 text-burnt-600"
              delay={100}
            />
            <StatCard
              icon={BarChart3}
              label="Pipeline value"
              value={128400}
              detail="6 open leads"
              iconClass="bg-blue-100 text-blue-600"
              delay={200}
            />
            <StatCard
              icon={Clock}
              label="Follow-ups"
              value={5}
              detail="Due this week"
              iconClass="bg-gold-100 text-gold-600"
              delay={300}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
