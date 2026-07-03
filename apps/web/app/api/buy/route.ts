// POST /api/buy — 买入仓位持久化
// 前端通过 TronLink 完成 approve + buyShares 后，
// 拿到真实 txHash，POST 到此路由写入 Supabase。
// 此路由不做链上调用，仅做数据持久化。
// v2: 使用 positions 余额模型（yes_balance / no_balance）+ trades 表。
import { getDb } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

interface BuyBody {
  marketId: string;
  side: "YES" | "NO";
  amount: number;
  shares?: number;
  price?: number;
  walletAddress: string;
  txHash: string;
}

export async function POST(req: Request) {
  let body: BuyBody;
  try {
    body = (await req.json()) as BuyBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { marketId, side, amount, shares: rawShares, price: rawPrice, walletAddress, txHash } = body;
  if (!marketId || !side || !amount || !walletAddress || !txHash) {
    return Response.json(
      {
        error:
          "Missing required fields: marketId, side, amount, walletAddress, txHash",
      },
      { status: 400 },
    );
  }
  if (side !== "YES" && side !== "NO") {
    return Response.json({ error: "side must be YES or NO" }, { status: 400 });
  }
  if (txHash.startsWith("mock_") || txHash.startsWith("sim_")) {
    return Response.json(
      { error: "Invalid txHash: mock transaction not accepted" },
      { status: 400 },
    );
  }

  const numAmount = Number(amount);
  const buyShares = rawShares !== undefined ? Number(rawShares) : numAmount; // fallback 1:1
  const buyPrice = rawPrice !== undefined ? Number(rawPrice) : 0.5;
  const fee = numAmount * 0.001;
  const platformFee = fee / 2;

  const db = getDb();
  let tradeId: string | undefined;

  if (db) {
    try {
      // 1) 查询当前持仓余额
      const pos = await db.getPosition(marketId, walletAddress);
      const currentYes = pos?.yes_balance ?? 0;
      const currentNo = pos?.no_balance ?? 0;
      const currentBought = pos?.total_bought ?? 0;

      // 2) 更新持仓余额
      await db.updatePosition({
        market_id: marketId,
        wallet_address: walletAddress,
        yes_balance: side === "YES" ? currentYes + buyShares : currentYes,
        no_balance: side === "NO" ? currentNo + buyShares : currentNo,
        total_bought: currentBought + buyShares,
      });

      // 3) 写入 trades 表
      const trade = await db.insertTrade({
        market_id: marketId,
        wallet_address: walletAddress,
        side,
        type: "buy",
        shares: buyShares,
        price: buyPrice,
        usdd_amount: numAmount,
        fee: platformFee,
        tx_hash: txHash,
      });
      tradeId = trade.id;
    } catch (err) {
      console.error("[api/buy] DB write failed:", err);
    }
  }

  return Response.json({
    id: tradeId ?? `buy_${Date.now().toString(16)}`,
    marketId,
    side,
    shares: buyShares,
    amount: numAmount,
    price: buyPrice,
    txHash,
    walletAddress,
    status: "confirmed",
    persisted: Boolean(tradeId),
  });
}
