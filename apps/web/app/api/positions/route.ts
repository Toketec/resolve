// GET /api/positions?wallet=<address>[&market=<marketId>] — 持仓查询
// v2: positions 改为余额模型（yes_balance / no_balance），支持 market 参数过滤。
//     每行余额拆分为 YES 和 NO 两笔独立 Position（仅余额 > 0 的出现）。
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

/**
 * 将余额模型的一行拆分为独立的 YES / NO Position 条目。
 * 仅余额 > 0 才生成条目，避免空行。
 */
function rowToPositions(row: PositionJoinRow): Position[] {
  const market =
    MOCK_MARKETS.find((m) => m.id === row.market_id) ??
    MOCK_MARKETS.find((m) => m.slug === row.markets?.slug);

  const yesPrice = market?.yesPrice ?? 0.5;
  const status = mapStatus(row.markets?.status ?? "active");
  const title = row.markets?.question ?? market?.title ?? "Unknown Market";
  const category = market?.category ?? "crypto";

  const entries: Position[] = [];

  if (Number(row.yes_balance) > 0) {
    entries.push({
      id: `${row.id}_YES`,
      marketId: row.market_id,
      marketTitle: title,
      marketCategory: category,
      side: "YES",
      shares: Number(row.yes_balance),
      avgPrice: 0.5, // demo 阶段未存储真实均价，以 0.5 为默认买入价
      currentPrice: yesPrice,
      status,
    });
  }

  if (Number(row.no_balance) > 0) {
    entries.push({
      id: `${row.id}_NO`,
      marketId: row.market_id,
      marketTitle: title,
      marketCategory: category,
      side: "NO",
      shares: Number(row.no_balance),
      avgPrice: 0.5,
      currentPrice: 1 - yesPrice,
      status,
    });
  }

  return entries;
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

      // 按钱包查所有持仓 → 拆分为独立 YES/NO 条目
      const rows = await db.listPositionsByWallet(wallet);
      if (rows.length > 0) {
        const positions: Position[] = (rows as PositionJoinRow[]).flatMap(rowToPositions);
        return Response.json(positions);
      }
    } catch (err) {
      console.error("[api/positions] Supabase read failed, falling back to mock:", err);
    }
  }

  return Response.json(MOCK_POSITIONS);
}
