// POST /api/buy — 买入仓位
// 数据层真实写入 Supabase positions 表（未配置 → 跳过持久化）；
// 链上签名部分本阶段 mock（阶段 4 替换为真实合约调用）。
import { getDb } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

interface BuyBody {
  marketId: string;
  side: "YES" | "NO";
  amount: number;
  walletAddress: string;
}

export async function POST(req: Request) {
  let body: BuyBody;
  try {
    body = (await req.json()) as BuyBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { marketId, side, amount, walletAddress } = body;
  if (!marketId || !side || !amount || !walletAddress) {
    return Response.json(
      { error: "Missing required fields: marketId, side, amount, walletAddress" },
      { status: 400 },
    );
  }
  if (side !== "YES" && side !== "NO") {
    return Response.json({ error: "side must be YES or NO" }, { status: 400 });
  }

  const txHash = `mock_tx_${Date.now().toString(16)}`;
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
      console.error("[api/buy] Supabase insert failed (returning mock position):", err);
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
