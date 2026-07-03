// POST /api/settle — 结算（赔付赢家）
// 气囊模式：调用 settleSimulated()（标记已结算，不转账）
// 真实模式：查询赢家持仓 → 按比例计算赔付 → settleBatch() 批量转账
// 使用服务端 owner 私钥签名（TRON_PRIVATE_KEY 环境变量）。
import { settleSimulated, settleBatch, getPoolState } from "@/lib/contract/settlement";
import { usddBalanceOf } from "@/lib/contract/usdd";
import { SETTLEMENT_ADDRESS } from "@/lib/constants";
import { listPositionsByMarket, updateMarket } from "@resolve/db";
import type { PositionRow } from "@resolve/db";

export const dynamic = "force-dynamic";

interface SettleBody {
  marketId: string;
  outcome: "YES" | "NO";
  winnerWallet?: string;
  payoutSun?: string;
}

export async function POST(req: Request) {
  let body: SettleBody;
  try {
    body = (await req.json()) as SettleBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { marketId, outcome, winnerWallet, payoutSun } = body;
  if (!marketId || !outcome) {
    return Response.json(
      { error: "Missing required fields: marketId, outcome" },
      { status: 400 },
    );
  }

  const airbag = process.env.NEXT_PUBLIC_AIRBAG_ENABLED !== "false";

  try {
    if (airbag) {
      // ── 气囊模式：调用 settleSimulated（标记已结算，不转账）──
      const txHash = await settleSimulated(marketId, outcome);
      // 更新 DB 市场状态
      await updateMarket(marketId, {
        status: "settled",
        resolved_outcome: outcome,
        settlement_tx_hash: txHash,
      });
      return Response.json({
        marketId,
        outcome,
        txHash,
        paidOut: false,
        simulated: true,
      });
    }

    // ── 真实模式：查询赢家 → 按比例计算 → 批量转账 ──

    // ① 查询所有持仓
    const positions = await listPositionsByMarket(marketId);

    // ② 筛选赢方持仓
    const isYesWin = outcome === "YES";
    const winners = positions.filter((p) => {
      const balance = isYesWin ? p.yes_balance : p.no_balance;
      return balance > 0;
    });

    // 无赢家 → 仅标记已结算
    if (winners.length === 0) {
      const simTx = await settleSimulated(marketId, outcome);
      await updateMarket(marketId, {
        status: "settled",
        resolved_outcome: outcome,
        settlement_tx_hash: simTx,
      });
      return Response.json({
        marketId,
        outcome,
        txHash: simTx,
        paidOut: false,
        simulated: false,
        note: "No winning positions to pay out",
      });
    }

    // ③ 获取合约可用余额
    let contractBalance: bigint;
    let feePool: bigint;
    try {
      contractBalance = await usddBalanceOf(SETTLEMENT_ADDRESS);
      const poolState = await getPoolState(marketId);
      feePool = poolState.feePool;
    } catch (e) {
      // 余额查询失败时降级为气囊模式
      console.warn("[api/settle] Balance query failed, falling back to simulated:", e);
      const simTx = await settleSimulated(marketId, outcome);
      await updateMarket(marketId, {
        status: "settled",
        resolved_outcome: outcome,
        settlement_tx_hash: simTx,
      });
      return Response.json({
        marketId,
        outcome,
        txHash: simTx,
        paidOut: false,
        simulated: true,
        note: "Failed to query on-chain balance — fallback to simulated",
      });
    }

    const availablePool = contractBalance - feePool;
    if (availablePool <= BigInt(0)) {
      return Response.json(
        { error: "Insufficient contract balance for payout" },
        { status: 500 },
      );
    }

    // ④ 计算分摊
    const totalWinningShares = winners.reduce((sum, p) => {
      return sum + BigInt(Math.round((isYesWin ? p.yes_balance : p.no_balance) * 1e6));
    }, BigInt(0));

    const winnerAddresses: string[] = [];
    const payoutAmounts: bigint[] = [];
    let totalPayout = BigInt(0);

    for (const p of winners) {
      const winBalance = isYesWin ? p.yes_balance : p.no_balance;
      if (winBalance <= 0) continue;

      const share = BigInt(Math.round(winBalance * 1e6));
      // payout = floor(availablePool * share / totalWinningShares)
      const payout = (availablePool * share) / totalWinningShares;

      winnerAddresses.push(p.wallet_address);
      payoutAmounts.push(payout);
      totalPayout += payout;
    }

    // 检查余额是否足以支付全部赔付
    if (totalPayout > contractBalance) {
      return Response.json(
        {
          error: `Insufficient contract balance: needs ${totalPayout} sun, has ${contractBalance} sun`,
        },
        { status: 500 },
      );
    }

    // ⑤ 调用 settleBatch()
    const txHash = await settleBatch(marketId, outcome, winnerAddresses, payoutAmounts);

    // ⑥ 更新 DB 市场状态
    await updateMarket(marketId, {
      status: "settled",
      resolved_outcome: outcome,
      settlement_tx_hash: txHash,
    });

    console.log(
      `[api/settle] winners=${winners.length} totalPool=${Number(availablePool) / 1e6} USDD distribution=[${payoutAmounts.map((a) => Number(a) / 1e6).join(",")}]`,
    );

    return Response.json({
      marketId,
      outcome,
      txHash,
      paidOut: true,
      simulated: false,
      winnerCount: winners.length,
      totalPayout: String(totalPayout),
    });
  } catch (err) {
    console.error("[api/settle] Chain call failed:", err);
    return Response.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Settle failed — check TRON_PRIVATE_KEY and contract state",
      },
      { status: 500 },
    );
  }
}
