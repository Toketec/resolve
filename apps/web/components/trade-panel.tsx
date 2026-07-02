"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Wallet,
} from "lucide-react";
import type { Market } from "@/lib/types";
import { cn, formatPct, formatUSD, shortAddr } from "@/lib/utils";
import { useWallet } from "@/components/wallet-provider";
import { buyShares as apiBuyShares } from "@/lib/api-client";
import { buyShares as contractBuyShares } from "@/lib/contract/settlement";
import { approveUSDD, usddToSun } from "@/lib/contract/usdd";
import {
  isTronLinkInstalled,
  isTronLinkConnected,
  getConnectedAddress,
} from "@/lib/contract/tronweb";
import { SETTLEMENT_ADDRESS, TRONSCAN_SHASTA } from "@/lib/constants";

const QUICK = [25, 100, 500];

type BuyPhase =
  | "idle"
  | "approving"      // TronLink 弹出 approve 授权
  | "buying"         // TronLink 弹出 buyShares
  | "persisting";    // POST /api/buy 持久化

interface BuyState {
  phase: BuyPhase;
  error?: string;
  txHash?: string;
  side?: "YES" | "NO";
  shares?: number;
}

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
  const busy = buy.phase !== "idle";
  const disabled = marketClosed || numAmt <= 0 || busy;
  const accent = side === "YES" ? "#00B14F" : "#FF2D6F";

  async function handleBuy() {
    if (marketClosed || numAmt <= 0) return;

    // 1) 确保 TronLink 已安装
    if (!isTronLinkInstalled()) {
      setBuy({ phase: "idle", error: "请安装 TronLink 浏览器扩展" });
      return;
    }

    // 2) 确保已连接
    if (!connected || !address) {
      await connect();
      return;
    }

    if (!isTronLinkConnected()) {
      setBuy({ phase: "idle", error: "TronLink 未连接，请打开 TronLink 并授权" });
      return;
    }

    const walletAddr = getConnectedAddress() || address;
    let txHash = "";

    try {
      // 3) 授权 USDD → TronLink 弹出签名
      const amountSun = usddToSun(numAmt);
      setBuy({ phase: "approving" });
      await approveUSDD(SETTLEMENT_ADDRESS, amountSun);

      // 4) 买入 → TronLink 弹出签名
      setBuy({ phase: "buying" });
      const isYes = side === "YES";
      const result = await contractBuyShares(market.id, side, amountSun);
      txHash = result.txHash;

      // 5) 持久化到 Supabase
      setBuy({ phase: "persisting" });
      const res = await apiBuyShares({
        marketId: market.id,
        side,
        amount: numAmt,
        walletAddress: walletAddr,
        txHash,
      });

      setBuy({
        phase: "idle",
        txHash,
        side,
        shares: res.shares,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "交易失败";

      if (msg.includes("拒绝") || msg.includes("reject") || msg.includes("cancel")) {
        setBuy({ phase: "idle", error: "授权或交易被取消，可重试" });
      } else if (txHash) {
        // 即使持久化失败，链上交易可能已成功
        setBuy({
          phase: "idle",
          txHash,
          side,
          shares,
          error: "买入已提交，TxHash: " + shortAddr(txHash),
        });
      } else {
        setBuy({ phase: "idle", error: msg });
      }
    }
  }

  const tronscanUrl = buy.txHash
    ? `${TRONSCAN_SHASTA}/#/transaction/${buy.txHash}`
    : null;

  // ── 按钮文案 ──
  let buttonLabel: string;
  if (marketClosed) {
    buttonLabel = "Market closed";
  } else if (buy.phase === "approving") {
    buttonLabel = "请确认授权 (TronLink)…";
  } else if (buy.phase === "buying") {
    buttonLabel = "请确认买入 (TronLink)…";
  } else if (buy.phase === "persisting") {
    buttonLabel = "保存记录中…";
  } else if (!isTronLinkInstalled()) {
    buttonLabel = "请安装 TronLink";
  } else if (!connected) {
    buttonLabel = connecting ? "连接中…" : "连接钱包买入";
  } else {
    buttonLabel = `买入 ${side}`;
  }

  return (
    <div className="overflow-hidden rounded-3xl border-2 border-ink bg-card shadow-stamp">
      {/* Side toggle: brutalist tabs */}
      <div className="grid grid-cols-2 border-b-2 border-ink">
        <button
          onClick={() => setSide("YES")}
          className={cn(
            "py-3.5 text-sm font-black uppercase tracking-[0.12em] transition",
            side === "YES"
              ? "bg-pitch-500 text-ink"
              : "bg-card text-ink/55 hover:bg-pitch-50",
          )}
        >
          Buy YES · {formatPct(market.yesPrice, 0)}
        </button>
        <button
          onClick={() => setSide("NO")}
          className={cn(
            "border-l-2 border-ink py-3.5 text-sm font-black uppercase tracking-[0.12em] transition",
            side === "NO"
              ? "bg-magenta-500 text-canvas"
              : "bg-card text-ink/55 hover:bg-crowd-100",
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
          <Cell
            label="Potential"
            value={formatUSD(potential)}
            accent={accent}
            bold
          />
          <Cell
            label="Profit if win"
            value={formatUSD(profit)}
            accent={accent}
            bold
          />
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

        {/* TronLink 未安装提示 */}
        {!isTronLinkInstalled() && !marketClosed && (
          <div className="mt-3 rounded-xl border-2 border-ink bg-raised px-3 py-2">
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-muted" />
              <p className="font-score text-[10px] font-bold uppercase tracking-wider text-muted">
                请安装 TronLink 浏览器扩展 · 切换到 Shasta 测试网
              </p>
            </div>
          </div>
        )}

        {/* 成功回调 */}
        {buy.txHash && buy.phase === "idle" && (
          <div className="mt-3 flex flex-col gap-2 rounded-xl border-2 border-ink bg-pitch-50 px-3 py-2">
            <div className="flex items-start gap-2">
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0 text-pitch-700"
                strokeWidth={2.5}
              />
              <div className="min-w-0">
                <p className="font-score text-[11px] font-black uppercase tracking-wider text-ink">
                  {buy.side} order filled · {buy.shares?.toFixed(2)} shares
                </p>
                <p className="font-score truncate text-[10px] font-bold text-muted">
                  tx {shortAddr(buy.txHash)}
                </p>
              </div>
            </div>
            {tronscanUrl && (
              <a
                href={tronscanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-pitch-700 underline hover:text-pitch-900 transition"
              >
                查看 Tronscan <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        )}

        {/* 错误提示 */}
        {buy.error && buy.phase === "idle" && (
          <div className="mt-3 rounded-xl border-2 border-magenta-500 bg-crowd-100 px-3 py-2">
            <p className="font-score text-[10px] font-bold uppercase tracking-wider text-magenta-700">
              {buy.error}
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
      <p className="font-score text-[10px] font-bold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p
        className={`font-score text-sm ${bold ? "font-black" : "font-bold"} text-ink`}
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
    </div>
  );
}
