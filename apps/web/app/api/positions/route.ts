// GET /api/positions?wallet=<address>[&market=<marketId>] — 持仓查询
// v2: positions 改为余额模型（yes_balance / no_balance），支持 market 参数过滤。
import { getDb } from "@/lib/supabase-server";
import { MOCK_POSITIONS, MOCK_MARKETS } from "@/lib/mock";
import type { Position } from "@/lib/types";
import type { PositionRow, MarketRow } from "@resolve/db";

export const dynamic = "force-dynamic";

type PositionJoinRow = PositionRow & { markets: MarketRow };

function mapStatus(dbStatus: string): Position["status"] {
  switch (dbStatus) {
    case "active":   return "live";
    case "resolving": return "resolving";
    case "resolved":
    case "settled":  return "resolved";
    default:         return "live";
  }
}

function rowToPosition(row: PositionJoinRow): Position {
  const market =
    MOCK_MARKETS.find((m) => m.id === row.market_id) ??
    MOCK_MARKETS.find((m) => m.slug === row.markets?.slug);

  const yesPrice = market?.yesPrice ?? 0.5;
  const currentPrice = yesPrice; // 简化：按 YES 持仓取 YES price

  return {
    id: row.id,
    marketId: row.market_id,
    marketTitle: row.markets?.question ?? market?.title ?? "Unknown Market",
    marketCategory: market?.category ?? "crypto",
    side: "YES", // 余额模型下 side 无单值意义，保留向后兼容
    shares: Number(row.yes_balance) + Number(row.no_balance),
    avgPrice: currentPrice,
    currentPrice,
    status: mapStatus(row.markets?.status ?? "active"),
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");
  const marketId = searchParams.get("market");

  if (!wallet) return Response.json([]);

  const db = getDb();
  if (db) {
    try {
      if (marketId) {
        // 查询指定市场下某钱包的持仓（返回余额详情）
        const pos = await db.getPosition(marketId, wallet);
        if (pos) {
          return Response.json({
            id: pos.id,
            marketId: pos.market_id,
            yesBalance: Number(pos.yes_balance),
            noBalance: Number(pos.no_balance),
            totalBought: Number(pos.total_bought),
            totalSold: Number(pos.total_sold),
          });
        }
        return Response.json({ yesBalance: 0, noBalance: 0 });
      }

      // 按钱包查所有持仓
      const rows = await db.listPositionsByWallet(wallet);
      if (rows.length > 0) {
        const positions: Position[] = (rows as PositionJoinRow[]).map(rowToPosition);
        return Response.json(positions);
      }
    } catch (err) {
      console.error("[api/positions] Supabase read failed, falling back to mock:", err);
    }
  }

  return Response.json(MOCK_POSITIONS);
}
