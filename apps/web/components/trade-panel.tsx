"use client";

import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { Market } from "@/lib/types";
import { cn, formatPct, formatUSD } from "@/lib/utils";

const QUICK = [25, 100, 500];

export function TradePanel({ market }: { market: Market }) {
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState<string>("100");

  const price = side === "YES" ? market.yesPrice : 1 - market.yesPrice;
  const numAmt = Math.max(0, Number(amount) || 0);
  const shares = useMemo(() => (price ? numAmt / price : 0), [numAmt, price]);
  const potential = shares * 1;
  const profit = potential - numAmt;
  const disabled = market.status !== "live" || numAmt <= 0;
  const accent = side === "YES" ? "#00B14F" : "#FF2D6F";

  return (
    <div className="overflow-hidden rounded-3xl border-2 border-ink bg-card shadow-stamp">
      {/* Side toggle: brutalist tabs */}
      <div className="grid grid-cols-2 border-b-2 border-ink">
        <button
          onClick={() => setSide("YES")}
          className={cn(
            "py-3.5 text-sm font-black uppercase tracking-[0.12em] transition",
            side === "YES" ? "bg-pitch-500 text-ink" : "bg-card text-ink/55 hover:bg-pitch-50",
          )}
        >
          Buy YES · {formatPct(market.yesPrice, 0)}
        </button>
        <button
          onClick={() => setSide("NO")}
          className={cn(
            "border-l-2 border-ink py-3.5 text-sm font-black uppercase tracking-[0.12em] transition",
            side === "NO" ? "bg-magenta-500 text-canvas" : "bg-card text-ink/55 hover:bg-crowd-100",
          )}
        >
          Buy NO · {formatPct(1 - market.yesPrice, 0)}
        </button>
      </div>

      <div className="p-5">
        <p className="font-score text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
          Amount
        </p>
        <div className="mt-1 flex items-baseline gap-2 border-b-2 border-ink pb-3">
          <input
            value={amount}
            inputMode="decimal"
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            className="font-display w-full bg-transparent text-4xl font-black text-ink outline-none placeholder:text-ink/30"
            placeholder="0"
            disabled={market.status !== "live"}
          />
          <span className="font-score text-sm font-bold text-muted">USDC</span>
        </div>

        <div className="mt-3 flex gap-1.5">
          {QUICK.map((q) => (
            <button
              key={q}
              onClick={() => setAmount(String(q))}
              className="rounded-full border-2 border-ink bg-raised px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink transition hover:bg-card"
            >
              ${q}
            </button>
          ))}
          <button
            onClick={() => setAmount("1000")}
            className="rounded-full border-2 border-ink bg-ink px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-canvas hover:bg-ink/85"
          >
            Max
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Cell label="Price" value={formatPct(price, 1)} />
          <Cell label="Shares" value={shares.toFixed(2)} />
          <Cell label="Potential" value={formatUSD(potential)} accent={accent} bold />
          <Cell label="Profit if win" value={formatUSD(profit)} accent={accent} bold />
        </div>

        <button
          disabled={disabled}
          className={cn(
            "mt-5 flex w-full items-center justify-between rounded-full border-2 border-ink px-5 py-3 text-sm font-black uppercase tracking-[0.12em] transition shadow-stamp-sm",
            disabled
              ? "cursor-not-allowed bg-raised text-muted shadow-none"
              : side === "YES"
              ? "bg-pitch-500 text-ink hover:-translate-y-0.5 hover:shadow-stamp"
              : "bg-magenta-500 text-canvas hover:-translate-y-0.5 hover:shadow-stamp",
          )}
        >
          <span>
            {market.status !== "live" ? "Market closed" : `Place ${side} order`}
          </span>
          {!disabled && <ArrowRight className="size-4" />}
        </button>

        <p className="font-score mt-3 text-center text-[10px] font-bold uppercase tracking-wider text-muted">
          0.10% fee · resolves via AI consensus
        </p>
      </div>
    </div>
  );
}

function Cell({
  label,
  value,
  accent,
  bold,
}: {
  label: string;
  value: string;
  accent?: string;
  bold?: boolean;
}) {
  return (
    <div className="rounded-xl border-2 border-ink bg-raised px-3 py-2">
      <p className="font-score text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p
        className={`font-score text-sm ${bold ? "font-black" : "font-bold"} text-ink`}
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
    </div>
  );
}
