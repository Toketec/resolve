// GET /api/trades?wallet=<address> | ?market=<marketId> — 交易记录查询
// 优先从 Supabase trades 表查询；失败时回退 mock 数据集。
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");
  const marketId = searchParams.get("market");

  const db = getDb();

  if (marketId) {
    // 按市场查询：返回该市场下所有交易记录（用于 Recent Trades）
    if (db) {
      try {
        const rows = await db.listTradesByMarket(marketId, 20);
        if (rows.length > 0) {
          return Response.json(rows.map(rowToTrade));
        }
      } catch (err) {
        console.error("[api/trades] DB market query failed:", err);
      }
    }
    // 回退：用 mock 数据按 marketId 过滤
    const mockMarketTrades = MOCK_TRADES.filter((t) => t.marketId === marketId).slice(0, 8);
    return Response.json(mockMarketTrades);
  }

  if (wallet) {
    // 按钱包查询
    if (db) {
      try {
        const rows = await db.listTradesByWallet(wallet, 50);
        if (rows.length > 0) {
          return Response.json(rows.map(rowToTrade));
        }
      } catch (err) {
        console.error("[api/trades] DB wallet query failed:", err);
      }
    }
    return Response.json(MOCK_TRADES.slice(0, 12));
  }

  // 无参数 → 返回空数组
  return Response.json([]);
}
