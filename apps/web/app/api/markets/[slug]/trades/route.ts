// GET /api/markets/[slug]/trades — 某市场下所有交易记录
// 从 positions 表派生 Trade[]，按时间倒序；DB 不可用时回退 mock。
import { getDb } from "@/lib/supabase-server";
import { MOCK_TRADES, MOCK_MARKETS } from "@/lib/mock";
import type { Trade } from "@/lib/types";
import type { PositionRow, MarketRow } from "@resolve/db";

export const dynamic = "force-dynamic";

type PositionJoinRow = PositionRow & { markets: MarketRow };

function rowToTrade(row: PositionJoinRow): Trade {
  const market = row.markets;
  const yesPrice = 0.5; // 真实定价后续由合约定价接口替换
  const price = row.side === "YES" ? yesPrice : 1 - yesPrice;

  return {
    id: row.id,
    marketId: row.market_id,
    marketTitle: market?.question ?? "Unknown Market",
    side: row.side,
    price,
    shares: Number(row.amount),
    at: row.created_at,
    user: {
      name: `user_${row.wallet_address.slice(0, 8)}`,
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
        // 2. 用 market.id 查 positions（joined with markets）
        const rows = (await db.listPositionsByMarket(market.id)) as PositionJoinRow[];
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
    : MOCK_TRADES.slice(0, 8);
  return Response.json(fallback);
}
