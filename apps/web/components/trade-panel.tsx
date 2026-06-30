"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import type { Market } from "@/lib/types";
import { cn, formatPct, formatUSD, shortAddr } from "@/lib/utils";
import { useWallet } from "@/components/wallet-provider";
import { buyShares as apiBuyShares } from "@/lib/api-client";

const QUICK = [25, 100, 500];

type BuyState =
  | { phase: "idle" }
  | { phase: "busy" }
  | { phase: "done"; txHash: string; side: "YES" | "NO"; shares: number }
  | { phase: "error"; message: string };

export function TradePanel({ market }: { market: Market }) {
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState<string>("100");
  const [buy, setBuy] = useState<BuyState>({ phase: "idle" });
  const { connected, address, connect, connecting } = useWallet();

  const price = side === "YES" ? market.yesPrice : 1 - market.yesPrice;
  const numAmt = Math.max(0, Number(amount) || 0);
  const shares = useMemo(() => (price ? numAmt / price : 0), [numAmt, price]);
  const potential = shares * 1;
  const profit = potential - numAmt;
  const marketClosed = market.status !== "live";
  const busy = buy.phase === "busy";
  const disabled = marketClosed || numAmt <= 0 || busy;
  const accent = side === "YES" ? "#00B14F" : "#FF2D6F";

  async function handleBuy() {
    if (marketClosed || numAmt <= 0) return;
    if (!connected || !address) {
      await connect();
      return;
    }
    setBuy({ phase: "busy" });
    try {
      const res = await apiBuyShares({
        marketId: market.id,
        side,
        amount: numAmt,
        walletAddress: address,
      });
      setBuy({ phase: "done", txHash: res.txHash, side, shares: res.shares });
    } catch (e) {
      setBuy({ phase: "error", message: e instanceof Error ? e.message : "Buy failed" });
    }
  }

  const buttonLabel = marketClosed
    ? "Market closed"
    : busy
    ? "Processing…"
    : !connected
    ? connecting
      ? "Connecting…"
      : "Connect wallet to buy"
    : `Place ${side} order`;

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
          <span className="font-score text-sm font-bold text-muted">USDD</span>
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
          onClick={handleBuy}
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
          <span>{buttonLabel}</span>
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            !disabled && <ArrowRight className="size-4" />
          )}
        </button>

        {buy.phase === "done" && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border-2 border-ink bg-pitch-50 px-3 py-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-pitch-700" strokeWidth={2.5} />
            <div className="min-w-0">
              <p className="font-score text-[11px] font-black uppercase tracking-wider text-ink">
                {buy.side} order filled · {buy.shares.toFixed(2)} shares
              </p>
              <p className="font-score truncate text-[10px] font-bold text-muted">
                tx {shortAddr(buy.txHash)}
              </p>
            </div>
          </div>
        )}
        {buy.phase === "error" && (
          <div className="mt-3 rounded-xl border-2 border-magenta-500 bg-crowd-100 px-3 py-2">
            <p className="font-score text-[10px] font-bold uppercase tracking-wider text-magenta-700">
              {buy.message} · tap to retry
            </p>
          </div>
        )}

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
