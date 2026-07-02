// GET /api/positions?wallet=<address> — 持仓查询
// Supabase 已配置 → 查 positions 表 join markets；否则回退 mock 数据集。
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
  const currentPrice = row.side === "YES" ? yesPrice : 1 - yesPrice;

  return {
    id: row.id,
    marketId: row.market_id,
    marketTitle: row.markets?.question ?? market?.title ?? "Unknown Market",
    marketCategory: market?.category ?? "crypto",
    side: row.side,
    shares: Number(row.amount),
    avgPrice: currentPrice,    // demo: 未存储历史买入价，使用当前市价
    currentPrice,
    status: mapStatus(row.markets?.status ?? "active"),
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
        const positions: Position[] = (rows as PositionJoinRow[]).map(rowToPosition);
        return Response.json(positions);
      }
    } catch (err) {
      console.error("[api/positions] Supabase read failed, falling back to mock:", err);
    }
  }

  return Response.json(MOCK_POSITIONS);
}
