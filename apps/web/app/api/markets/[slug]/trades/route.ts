// GET /api/markets/[slug]/trades — 某市场下所有交易记录
// v2: 从 trades 表直接查询交易记录，按时间倒序；DB 不可用时回退 mock。
import { getDb } from "@/lib/supabase-server";
import { MOCK_TRADES, MOCK_MARKETS } from "@/lib/mock";
import type { Trade } from "@/lib/types";
import type { TradeRow } from "@resolve/db";

export const dynamic = "force-dynamic";

function rowToTrade(row: TradeRow): Trade {
  const market = MOCK_MARKETS.find((m) => m.id === row.market_id);
  return {
    id: row.id,
    marketId: row.market_id,
    marketTitle: market?.title ?? row.market_id,
    side: row.side,
    price: Number(row.price),
    shares: Number(row.shares),
    at: row.created_at,
    user: {
      name: `user_${row.wallet_address.slice(0, 6)}`,
      address: row.wallet_address,
    },
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const db = getDb();
  if (db) {
    try {
      // 1. 通过 slug 查找 market，拿到 UUID id
      const market = await db.getMarketBySlug(slug);
      if (market) {
        // 2. 用 market.id 查 trades 表
        const rows = await db.listTradesByMarket(market.id, 20);
        if (rows.length > 0) {
          const trades: Trade[] = rows.map(rowToTrade);
          return Response.json(trades);
        }
      }
    } catch (err) {
      console.error("[api/markets/[slug]/trades] DB failed, falling back to mock:", err);
    }
  }

  // 回退 mock
  const mockMarket = MOCK_MARKETS.find((m) => m.slug === slug);
  const fallback = mockMarket
    ? MOCK_TRADES.filter((t) => t.marketId === mockMarket.id).slice(0, 8)
    : [];
  return Response.json(fallback);
}
