// POST /api/buy — 买入仓位持久化
// 前端通过 TronLink 完成 approve + buyShares 后，
// 拿到真实 txHash，POST 到此路由写入 Supabase。
// 此路由不做链上调用，仅做数据持久化。
import { getDb } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

interface BuyBody {
  marketId: string;
  side: "YES" | "NO";
  amount: number;
  walletAddress: string;
  txHash: string; // ← 真实链上交易 hash（必传）
}

export async function POST(req: Request) {
  let body: BuyBody;
  try {
    body = (await req.json()) as BuyBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { marketId, side, amount, walletAddress, txHash } = body;
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
  // 校验 txHash 不是 mock 前缀（防止绕过真实合约调用）
  if (txHash.startsWith("mock_") || txHash.startsWith("sim_")) {
    return Response.json(
      { error: "Invalid txHash: mock transaction not accepted" },
      { status: 400 },
    );
  }

  let id: string | undefined;

  const db = getDb();
  if (db) {
    try {
      const row = await db.insertPosition({
        market_id: marketId,
        wallet_address: walletAddress,
        side,
        amount: Number(amount),
        tx_hash: txHash,
      });
      id = row.id;
    } catch (err) {
      console.error(
        "[api/buy] Supabase insert failed (returning position without id):",
        err,
      );
    }
  }

  // shares 简化为 1:1（demo），真实下注份额由合约定价
  return Response.json({
    id: id ?? `pos_${Date.now().toString(16)}`,
    marketId,
    side,
    shares: Number(amount),
    amount: Number(amount),
    txHash,
    walletAddress,
    status: "confirmed",
    persisted: Boolean(id),
  });
}
