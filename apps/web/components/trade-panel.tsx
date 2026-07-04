"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
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
import { buyShares as apiBuyShares, sellShares as apiSellShares } from "@/lib/api-client";
import { buyShares as contractBuyShares, sellShares as contractSellShares } from "@/lib/contract/settlement";
import { approveUSDD, usddToSun, sunToUsdd } from "@/lib/contract/usdd";
import {
  isTronLinkInstalled,
  isTronLinkConnected,
  getConnectedAddress,
} from "@/lib/contract/tronweb";
import { SETTLEMENT_ADDRESS, TRONSCAN_SHASTA } from "@/lib/constants";

const QUICK = [25, 100, 500];
const PRICE_DECIMALS = 1e18; // 合约价格精度
const BUYBACK_LS_KEY = "resolve.htxBuybackTotal";

type TradeMode = "buy" | "sell";
type TradePhase =
  | "idle"
  | "approving"
  | "trading"
  | "persisting";

interface TradeState {
  phase: TradePhase;
  error?: string;
  txHash?: string;
  mode: TradeMode;
  side?: "YES" | "NO";
  shares?: number;
}

interface PositionBalance {
  yesBalance: number;
  noBalance: number;
}

export function TradePanel({ market }: { market: Market }) {
  const [mode, setMode] = useState<TradeMode>("buy");
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState<string>("100");
  const [trade, setTrade] = useState<TradeState>({ phase: "idle", mode: "buy" });
  const [balance, setBalance] = useState<PositionBalance>({ yesBalance: 0, noBalance: 0 });
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [buybackTotal, setBuybackTotal] = useState(0);
  const { connected, address, connect, connecting } = useWallet();

  // ── AMM 价格计算 ──
  // YES_price = 0.5 + net / (2 * L), clamped [0.01, 0.99]
  const ammPrice = (() => {
    // 使用 market 的 yesPrice 作为当前 AMM 价格代理
    const yesP = Math.max(0.01, Math.min(0.99, market.yesPrice));
    return {
      yes: yesP,
      no: 1 - yesP,
    };
  })();

  const price = side === "YES" ? ammPrice.yes : ammPrice.no;
  const numAmt = Math.max(0, Number(amount) || 0);

  // 买入估算
  const buyShares = useMemo(() => (price ? numAmt / price : 0), [numAmt, price]);
  const buyFee = numAmt * 0.001;
  const buyPotential = buyShares * 1;

  // 卖出估算
  const sellShares = useMemo(() => Math.max(0, Number(amount) || 0), [amount]);
  const sellGross = sellShares * price;
  const sellFee = sellGross * 0.001;
  const sellProceeds = sellGross - sellFee;

  const marketClosed = market.status !== "live";
  const busy = trade.phase !== "idle";
  const disabled = marketClosed || numAmt <= 0 || busy;

  // 卖出时检查余额
  const maxSellShares = side === "YES" ? balance.yesBalance : balance.noBalance;
  const sellDisabled = mode === "sell" && sellShares > maxSellShares;

  const accent = side === "YES" ? "#00B14F" : "#FF2D6F";

  // ── $HTX Buyback 计数器 ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BUYBACK_LS_KEY);
      if (raw) {
        const v = Number(raw);
        if (!isNaN(v)) setBuybackTotal(v);
      }
    } catch { /* localStorage 不可用静默降级 */ }
  }, []);

  function addBuyback(fee: number) {
    setBuybackTotal((prev) => {
      const next = prev + fee * 0.5;
      try { localStorage.setItem(BUYBACK_LS_KEY, String(next)); } catch {}
      return next;
    });
  }

  // ── 加载持仓 ──
  const loadBalance = useCallback(async () => {
    if (!connected || !address) return;
    setLoadingBalance(true);
    try {
      const res = await fetch(`/api/positions?wallet=${encodeURIComponent(address)}&market=${market.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === "object") {
          setBalance({
            yesBalance: Number(data.yesBalance ?? data.yes_balance ?? 0),
            noBalance: Number(data.noBalance ?? data.no_balance ?? 0),
          });
        }
      }
    } catch {
      // 静默失败，维持旧余额
    } finally {
      setLoadingBalance(false);
    }
  }, [connected, address, market.id]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance, trade.phase]); // 交易完成后刷新

  // ── 买入处理 ──
  async function handleBuy() {
    if (marketClosed || numAmt <= 0) return;

    if (!isTronLinkInstalled()) {
      setTrade({ phase: "idle", mode: "buy", error: "请安装 TronLink 浏览器扩展" });
      return;
    }
    if (!connected || !address) {
      await connect();
      return;
    }
    if (!isTronLinkConnected()) {
      setTrade({ phase: "idle", mode: "buy", error: "TronLink 未连接，请打开 TronLink 并授权" });
      return;
    }

    const walletAddr = getConnectedAddress() || address;
    let txHash = "";

    try {
      const amountSun = usddToSun(numAmt);
      setTrade({ phase: "approving", mode: "buy" });
      await approveUSDD(SETTLEMENT_ADDRESS, amountSun);

      setTrade({ phase: "trading", mode: "buy" });
      const result = await contractBuyShares(market.slug, side, amountSun);
      txHash = result.txHash;

      setTrade({ phase: "persisting", mode: "buy" });
      const res = await apiBuyShares({
        marketId: market.id,
        side,
        amount: numAmt,
        shares: buyShares,
        price,
        walletAddress: walletAddr,
        txHash,
      });

      setTrade({
        phase: "idle",
        mode: "buy",
        txHash,
        side,
        shares: res.shares,
      });
      addBuyback(buyFee);
      setAmount("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "交易失败";

      if (msg.includes("拒绝") || msg.includes("reject") || msg.includes("cancel")) {
        setTrade({ phase: "idle", mode: "buy", error: "授权或交易被取消，可重试" });
      } else if (txHash) {
        setTrade({
          phase: "idle",
          mode: "buy",
          txHash,
          side,
          shares: buyShares,
          error: "买入已提交，TxHash: " + shortAddr(txHash),
        });
      } else {
        setTrade({ phase: "idle", mode: "buy", error: msg });
      }
    }
  }

  // ── 卖出处理 ──
  async function handleSell() {
    if (marketClosed || sellShares <= 0 || sellDisabled) return;

    if (!isTronLinkInstalled()) {
      setTrade({ phase: "idle", mode: "sell", error: "请安装 TronLink 浏览器扩展" });
      return;
    }
    if (!connected || !address) {
      await connect();
      return;
    }
    if (!isTronLinkConnected()) {
      setTrade({ phase: "idle", mode: "sell", error: "TronLink 未连接，请打开 TronLink 并授权" });
      return;
    }

    const walletAddr = getConnectedAddress() || address;
    let txHash = "";

    try {
      // 卖出不需要 approve（份额已经在合约中）
      // sharesSun: 以 sun 为单位传递给合约（与合约 stakes 精度一致）
      const sharesSun = BigInt(Math.floor(sellShares * 1e6));

      setTrade({ phase: "trading", mode: "sell" });
      const result = await contractSellShares(market.slug, side, sharesSun);
      txHash = result.txHash;

      setTrade({ phase: "persisting", mode: "sell" });
      const res = await apiSellShares({
        marketId: market.id,
        side,
        shares: sellShares,
        usddAmount: sellProceeds,
        price,
        walletAddress: walletAddr,
        txHash,
      });

      setTrade({
        phase: "idle",
        mode: "sell",
        txHash,
        side,
        shares: res.shares,
      });
      addBuyback(sellFee);
      setAmount("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "交易失败";

      if (msg.includes("拒绝") || msg.includes("reject") || msg.includes("cancel")) {
        setTrade({ phase: "idle", mode: "sell", error: "交易被取消，可重试" });
      } else if (txHash) {
        setTrade({
          phase: "idle",
          mode: "sell",
          txHash,
          side,
          shares: sellShares,
          error: "卖出已提交，TxHash: " + shortAddr(txHash),
        });
      } else {
        setTrade({ phase: "idle", mode: "sell", error: msg });
      }
    }
  }

  const tronscanUrl = trade.txHash
    ? `${TRONSCAN_SHASTA}/#/transaction/${trade.txHash}`
    : null;

  // ── 按钮文案 ──
  let buttonLabel: string;
  const isTrading = trade.phase !== "idle";
  if (marketClosed) {
    buttonLabel = "Market closed";
  } else if (sellDisabled && mode === "sell") {
    buttonLabel = "Insufficient balance";
  } else if (trade.phase === "approving") {
    buttonLabel = "请确认授权 (TronLink)…";
  } else if (trade.phase === "trading") {
    buttonLabel = mode === "buy" ? "请确认买入 (TronLink)…" : "请确认卖出 (TronLink)…";
  } else if (trade.phase === "persisting") {
    buttonLabel = "保存记录中…";
  } else if (!isTronLinkInstalled()) {
    buttonLabel = "请安装 TronLink";
  } else if (!connected) {
    buttonLabel = connecting ? "连接中…" : "连接钱包交易";
  } else {
    buttonLabel = mode === "buy" ? `Buy ${side}` : `Sell ${side}`;
  }

  return (
    <div className="overflow-hidden rounded-3xl border-2 border-ink bg-card shadow-stamp">
      {/* Mode tabs: Buy / Sell */}
      <div className="grid grid-cols-2 border-b-2 border-ink">
        <button
          onClick={() => setMode("buy")}
          className={cn(
            "py-3.5 text-sm font-black uppercase tracking-[0.12em] transition",
            mode === "buy"
              ? "bg-raised text-ink"
              : "bg-card text-ink/45 hover:bg-raised/50",
          )}
        >
          Buy
        </button>
        <button
          onClick={() => setMode("sell")}
          className={cn(
            "border-l-2 border-ink py-3.5 text-sm font-black uppercase tracking-[0.12em] transition",
            mode === "sell"
              ? "bg-raised text-ink"
              : "bg-card text-ink/45 hover:bg-raised/50",
          )}
        >
          Sell
        </button>
      </div>

      {/* Side toggle */}
      <div className="grid grid-cols-2 border-b-2 border-ink">
        <button
          onClick={() => setSide("YES")}
          className={cn(
            "py-3 text-sm font-black uppercase tracking-[0.12em] transition",
            side === "YES"
              ? "bg-pitch-500 text-ink"
              : "bg-card text-ink/55 hover:bg-pitch-50",
          )}
        >
          {mode === "buy" ? "Buy" : "Sell"} YES · {formatPct(ammPrice.yes, 0)}
        </button>
        <button
          onClick={() => setSide("NO")}
          className={cn(
            "border-l-2 border-ink py-3 text-sm font-black uppercase tracking-[0.12em] transition",
            side === "NO"
              ? "bg-magenta-500 text-canvas"
              : "bg-card text-ink/55 hover:bg-crowd-100",
          )}
        >
          {mode === "buy" ? "Buy" : "Sell"} NO · {formatPct(ammPrice.no, 0)}
        </button>
      </div>

      <div className="p-5">
        {/* 输入框 */}
        <p className="font-score text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
          {mode === "buy" ? "Amount (USDD)" : "Shares"}
        </p>
        <div className="mt-1 flex items-baseline gap-2 border-b-2 border-ink pb-3">
          <input
            value={amount}
            inputMode="decimal"
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            className="font-display w-full bg-transparent text-4xl font-black text-ink outline-none placeholder:text-ink/30"
            placeholder={mode === "buy" ? "100" : "0"}
            disabled={market.status !== "live"}
          />
          <span className="font-score text-sm font-bold text-muted">
            {mode === "buy" ? "USDD" : "shares"}
          </span>
        </div>

        {/* 快捷按钮 */}
        <div className="mt-3 flex gap-1.5">
          {mode === "buy"
            ? QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => setAmount(String(q))}
                  className="rounded-full border-2 border-ink bg-raised px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink transition hover:bg-card"
                >
                  ${q}
                </button>
              ))
            : [25, 50, 100].map((q) => (
                <button
                  key={q}
                  onClick={() => setAmount(String(q))}
                  className="rounded-full border-2 border-ink bg-raised px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink transition hover:bg-card"
                >
                  {q} sh
                </button>
              ))}
          <button
            onClick={() => {
              if (mode === "buy") {
                setAmount("1000");
              } else {
                setAmount(String(Math.floor(maxSellShares)));
              }
            }}
            className="rounded-full border-2 border-ink bg-ink px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-canvas hover:bg-ink/85"
          >
            Max
          </button>
        </div>

        {/* 卖出持仓提示 */}
        {mode === "sell" && (
          <div className="mt-3 flex items-center justify-between rounded-xl border-2 border-ink bg-raised px-3 py-2">
            <p className="font-score text-[10px] font-bold uppercase tracking-wider text-muted">
              Your {side} balance
            </p>
            <p className="font-score text-sm font-black text-ink" style={{ color: accent }}>
              {loadingBalance ? (
                <Loader2 className="inline size-3 animate-spin" />
              ) : (
                `${maxSellShares.toFixed(2)} shares`
              )}
            </p>
          </div>
        )}

        {/* 订单详情 */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Cell label="Price" value={formatPct(price, 1)} />
          {mode === "buy" ? (
            <>
              <Cell label="Est. Shares" value={buyShares.toFixed(2)} />
              <Cell label="Fee (0.1%)" value={formatUSD(buyFee)} />
              <Cell label="Potential" value={formatUSD(buyPotential)} accent={accent} bold />
            </>
          ) : (
            <>
              <Cell label="Est. Proceeds" value={formatUSD(sellGross)} />
              <Cell label="Fee (0.1%)" value={formatUSD(sellFee)} />
              <Cell label="Net Receive" value={formatUSD(sellProceeds)} accent={accent} bold />
            </>
          )}
        </div>

        {/* 买入/卖出按钮 */}
        <button
          onClick={mode === "buy" ? handleBuy : handleSell}
          disabled={disabled || sellDisabled}
          className={cn(
            "mt-5 flex w-full items-center justify-between rounded-full border-2 border-ink px-5 py-3 text-sm font-black uppercase tracking-[0.12em] transition shadow-stamp-sm",
            disabled || sellDisabled
              ? "cursor-not-allowed bg-raised text-muted shadow-none"
              : side === "YES"
                ? "bg-pitch-500 text-ink hover:-translate-y-0.5 hover:shadow-stamp"
                : "bg-magenta-500 text-canvas hover:-translate-y-0.5 hover:shadow-stamp",
          )}
        >
          <span>{buttonLabel}</span>
          {isTrading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            !disabled && !sellDisabled && <ArrowRight className="size-4" />
          )}
        </button>

        {/* TronLink 提示 */}
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
        {trade.txHash && trade.phase === "idle" && (
          <div className="mt-3 flex flex-col gap-2 rounded-xl border-2 border-ink bg-pitch-50 px-3 py-2">
            <div className="flex items-start gap-2">
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0 text-pitch-700"
                strokeWidth={2.5}
              />
              <div className="min-w-0">
                <p className="font-score text-[11px] font-black uppercase tracking-wider text-ink">
                  {trade.side} {trade.mode === "sell" ? "sold" : "order filled"} · {trade.shares?.toFixed(2)} shares
                </p>
                <p className="font-score truncate text-[10px] font-bold text-muted">
                  tx {shortAddr(trade.txHash)}
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
        {trade.error && trade.phase === "idle" && (
          <div className="mt-3 rounded-xl border-2 border-magenta-500 bg-crowd-100 px-3 py-2">
            <p className="font-score text-[10px] font-bold uppercase tracking-wider text-magenta-700">
              {trade.error}
            </p>
          </div>
        )}

        <p className="font-score mt-3 text-center text-[10px] font-bold uppercase tracking-wider text-muted">
          0.10% fee → $HTX Buyback: {formatUSD(buybackTotal, { compact: true })} USDD · resolves via AI consensus
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
