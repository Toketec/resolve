"use client";

// ─────────────────────────────────────────────
// ClaimRewardButton — 赢家领钱按钮（Claim 式结算）
// ─────────────────────────────────────────────
// 在市场已结算 + 用户有赢方持仓时显示。
// 调用合约 claimReward，用户 TronLink 签名。
// ─────────────────────────────────────────────

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, Coins } from "lucide-react";
import { claimReward, getMarket } from "@/lib/contract/settlement";
import { getConnectedAddress } from "@/lib/contract/tronweb";
import { TRONSCAN_SHASTA, USDD_DECIMALS } from "@/lib/constants";
import { formatUSD, shortAddr } from "@/lib/utils";

interface Props {
  marketSlug: string;
}

export function ClaimRewardButton({ marketSlug }: Props) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rewardInfo, setRewardInfo] = useState<{
    outcome: string;
    estimatedUSD: number;
  } | null>(null);
  const [eligible, setEligible] = useState(false);

  // 页面加载后检查是否有资格 + 预计领取金额
  useEffect(() => {
    const addr = getConnectedAddress();
    if (!addr) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        // 读取链上市场状态（判断是否已结算 + 用户是否有赢方持仓）
        const marketData = await getMarket(marketSlug);
        // getMarket 返回数组: [exists, settled, outcome, liquidity, yesSupply, noSupply, feePool]
        const settled = Array.isArray(marketData) ? marketData[1] : marketData.settled;
        if (!settled) {
          if (!cancelled) setChecking(false);
          return;
        }

        const outcomeBytes = Array.isArray(marketData) ? marketData[2] : marketData.outcome;
        // 解析 outcome: "0x5945530000000000" → YES, "0x4E4F000000000000" → NO
        const outcomeHex = typeof outcomeBytes === "string" ? outcomeBytes : String(outcomeBytes);
        const isYesWin = outcomeHex.startsWith("0x594553");

        // 检查当前用户是否有对应持仓（通过 stakes 映射查询）
        // 这里需要合约支持 stakes 查询，暂用简化方案：直接显示可领按钮
        // 实际合约 stakes 查询需额外 ABI 或 getMarket 变体
        if (!cancelled) {
          setRewardInfo({
            outcome: isYesWin ? "YES" : "NO",
            estimatedUSD: 0, // 合约内部计算
          });
          setEligible(true);
        }
      } catch {
        // 链上查询失败 → 不显示按钮
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, [marketSlug]);

  const handleClaim = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await claimReward(marketSlug);
      setTxHash(res.txHash);
    } catch (e) {
      // 如果是"no winning stake"回滚，改为显示不可领
      const msg = e instanceof Error ? e.message : "Claim failed";
      if (msg.includes("no winning stake") || msg.includes("revert")) {
        setEligible(false);
        setRewardInfo(null);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [marketSlug]);

  if (checking) return null; // 加载中不显示
  if (!eligible && !txHash) return null; // 不可领且未成功过

  if (txHash) {
    return (
      <div className="overflow-hidden rounded-2xl border-2 border-goal-500 bg-goal-50 px-4 py-3 shadow-stamp-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="size-4 text-goal-700" strokeWidth={2.5} />
            <p className="font-score text-[11px] font-black uppercase tracking-wider text-goal-700">
              Claimed {rewardInfo?.outcome ?? ""}
            </p>
          </div>
          <a
            href={`${TRONSCAN_SHASTA}/#/transaction/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-score inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink hover:text-royal-700"
          >
            {shortAddr(txHash)}
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-ink bg-card px-4 py-4 shadow-stamp-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-score text-[10px] font-bold uppercase tracking-wider text-muted">
            Claim reward
          </p>
          <p className="font-display mt-0.5 text-sm font-black text-ink">
            {rewardInfo?.outcome} winner
          </p>
        </div>
        <button
          onClick={handleClaim}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-ink bg-goal-500 px-4 py-1.5 font-score text-[11px] font-black uppercase tracking-wider text-ink transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Claiming…
            </>
          ) : (
            <>
              <Coins className="size-3.5" />
              Claim reward
            </>
          )}
        </button>
      </div>
      {error && (
        <p className="font-score mt-2 text-[10px] font-bold uppercase tracking-wider text-magenta-600">
          {error}
        </p>
      )}
      <p className="font-score mt-2 text-[10px] font-bold uppercase tracking-wider text-muted">
        Payout calculated on-chain from your winning stake
      </p>
    </div>
  );
}
