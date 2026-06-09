"use client";

import { useMemo, useState } from "react";
import { cn, formatPct } from "@/lib/utils";

type Range = "1d" | "1w" | "1m" | "all";
const RANGE_POINTS: Record<Range, number> = { "1d": 12, "1w": 28, "1m": 48, all: 60 };

export function PriceChart({
  history,
  yesPrice,
}: {
  history: { t: number; yes: number }[];
  yesPrice: number;
}) {
  const [range, setRange] = useState<Range>("1w");

  const visible = useMemo(() => {
    const n = RANGE_POINTS[range];
    return history.slice(-n);
  }, [history, range]);

  const min = Math.min(...visible.map((p) => p.yes), 0);
  const max = Math.max(...visible.map((p) => p.yes), 1);
  const positive = yesPrice >= 0.5;
  const color = positive ? "#00B14F" : "#FF2D6F";

  const W = 800;
  const H = 240;
  const pad = 14;
  const xs = visible.map((_, i) => (i / Math.max(1, visible.length - 1)) * (W - pad * 2) + pad);
  const ys = visible.map((p) => {
    const norm = (p.yes - min) / Math.max(0.0001, max - min);
    return H - pad - norm * (H - pad * 2);
  });
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");
  const fill = `${d} L ${xs[xs.length - 1].toFixed(1)} ${H} L ${xs[0].toFixed(1)} ${H} Z`;

  return (
    <div className="overflow-hidden rounded-3xl border-2 border-ink bg-card shadow-stamp-sm">
      <div className="flex items-center justify-between border-b-2 border-ink bg-raised px-4 py-3">
        <div className="flex items-baseline gap-3">
          <p className="font-score text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
            YES price
          </p>
          <p className="font-display text-3xl font-black tabular-nums" style={{ color }}>
            {formatPct(yesPrice, 1)}
          </p>
        </div>
        <div className="flex gap-1 rounded-full border-2 border-ink bg-card p-1">
          {(["1d", "1w", "1m", "all"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition",
                range === r ? "bg-ink text-canvas" : "text-muted hover:text-ink",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-card">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-[240px] w-full">
          <defs>
            <linearGradient id="pc-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1={0} x2={W} y1={H / 2} y2={H / 2} stroke="#E8E5DD" strokeDasharray="3 6" strokeWidth="2" />
          <path d={fill} fill="url(#pc-grad)" />
          <path d={d} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <circle
            cx={xs[xs.length - 1]}
            cy={ys[ys.length - 1]}
            r="6"
            fill={color}
            stroke="#0A0A0A"
            strokeWidth="2"
          />
        </svg>
      </div>
      <div className="grid grid-cols-4 border-t-2 border-ink bg-raised">
        <Tick label="Low" value={formatPct(min, 1)} />
        <Tick label="High" value={formatPct(max, 1)} border />
        <Tick
          label="Change"
          value={formatPct(visible[visible.length - 1].yes - visible[0].yes, 1)}
          border
        />
        <Tick label="Points" value={visible.length.toString()} border />
      </div>
    </div>
  );
}

function Tick({ label, value, border }: { label: string; value: string; border?: boolean }) {
  return (
    <div className={`px-4 py-2.5 ${border ? "border-l-2 border-ink" : ""}`}>
      <p className="font-score text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="font-score text-sm font-bold tabular-nums text-ink">{value}</p>
    </div>
  );
}
