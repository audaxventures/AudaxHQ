"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";

export interface TimeSeriesPoint {
  label: string;
  value: number;
}

const VIEW_WIDTH = 600;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 28;

export function TimeSeriesChart({
  data,
  height = 200,
  color = "#be5a1e",
  fillColor = "#f7e2cc",
  valueFormatter = (v: number) => String(v),
  emptyTitle = "No data yet",
  emptyDescription,
}: {
  data: TimeSeriesPoint[];
  height?: number;
  color?: string;
  fillColor?: string;
  valueFormatter?: (v: number) => string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const innerWidth = VIEW_WIDTH - PAD_LEFT - PAD_RIGHT;
  const innerHeight = height - PAD_TOP - PAD_BOTTOM;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const n = data.length;

  const x = (i: number) => PAD_LEFT + (n === 1 ? innerWidth / 2 : (i / (n - 1)) * innerWidth);
  const y = (v: number) => PAD_TOP + innerHeight - (v / maxValue) * innerHeight;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.value)}`).join(" ");
  const areaPath = `${linePath} L${x(n - 1)},${PAD_TOP + innerHeight} L${x(0)},${PAD_TOP + innerHeight} Z`;

  // Show at most 6 x-axis labels so months don't crowd on longer series.
  const labelStep = Math.max(1, Math.ceil(n / 6));
  const labelIndices = data.map((_, i) => i).filter((i) => i % labelStep === 0 || i === n - 1);

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = (e.clientX - rect.left) / rect.width;
    const index = Math.round(fraction * (n - 1));
    setHoverIndex(Math.min(n - 1, Math.max(0, index)));
  }

  const hovered = hoverIndex !== null ? data[hoverIndex] : null;
  const tooltipLeftPct = hoverIndex !== null ? (x(hoverIndex) / VIEW_WIDTH) * 100 : 0;

  return (
    <div className="relative">
      {hovered && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg bg-navy-900 px-2.5 py-1.5 text-xs text-cream-50 shadow-lg"
          style={{ left: `${tooltipLeftPct}%`, top: 0 }}
        >
          <p className="font-medium tabular-nums">{valueFormatter(hovered.value)}</p>
          <p className="text-navy-300">{hovered.label}</p>
        </div>
      )}
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
        preserveAspectRatio="none"
        width="100%"
        height={height}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
        className="cursor-crosshair"
      >
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD_LEFT}
            x2={VIEW_WIDTH - PAD_RIGHT}
            y1={PAD_TOP + innerHeight * f}
            y2={PAD_TOP + innerHeight * f}
            stroke="#e9ecf2"
            strokeWidth={1}
          />
        ))}
        <path d={areaPath} fill={fillColor} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {hoverIndex !== null && (
          <>
            <line
              x1={x(hoverIndex)}
              x2={x(hoverIndex)}
              y1={PAD_TOP}
              y2={PAD_TOP + innerHeight}
              stroke="#d3d9e5"
              strokeWidth={1}
            />
            <circle cx={x(hoverIndex)} cy={y(data[hoverIndex].value)} r={4} fill={color} stroke="white" strokeWidth={1.5} />
          </>
        )}
        {labelIndices.map((i) => (
          <text key={i} x={x(i)} y={height - 8} fontSize={10} fill="#7c8aa3" textAnchor="middle">
            {data[i].label}
          </text>
        ))}
      </svg>
    </div>
  );
}
