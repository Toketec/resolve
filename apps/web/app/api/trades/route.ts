// GET /api/trades?wallet=<address> — 交易记录查询
// Supabase 已配置 → 从 positions 表派生交易记录；否则回退 mock 数据集。
import { getDb } from "@/lib/supabase-server";
import { MOCK_TRADES, MOCK_MARKETS } from "@/lib/mock";
import type { Trade } from "@/lib/types";
import type { PositionRow, MarketRow } from "@resolve/db";

export const dynamic = "force-dynamic";

type PositionJoinRow = PositionRow & { markets: MarketRow };

function rowToTrade(row: PositionJoinRow): Trade {
  const market = MOCK_MARKETS.find((m) => m.id === row.market_id);
  const yesPrice = market?.yesPrice ?? 0.5;
  const price = row.side === "YES" ? yesPrice : 1 - yesPrice;

  return {
    id: row.id,
    marketId: row.market_id,
    marketTitle: row.markets?.question ?? market?.title ?? "Unknown Market",
    side: row.side,
    price,
    shares: Number(row.amount),
    at: row.created_at,
    user: {
      name: `user_${row.wallet_address.slice(0, 6)}`,
      address: row.wallet_address,
    },
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");
  if (!wallet) return Response.json([]);

  const db = getDb();
  if (db) {
    try {
      const rows = await db.listPositionsByWallet(wallet);
      if (rows.length > 0) {
        const trades: Trade[] = (rows as PositionJoinRow[]).map(rowToTrade);
        return Response.json(trades);
      }
    } catch (err) {
      console.error("[api/trades] Supabase read failed, falling back to mock:", err);
    }
  }

  return Response.json(MOCK_TRADES.slice(0, 12));
}
