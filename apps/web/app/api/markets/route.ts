// GET /api/markets — 市场列表
// Supabase 已配置 → 读 markets 表；否则回退 mock 数据集。
import { getDb } from "@/lib/supabase-server";
import { marketRowToMarket, fallbackMarkets } from "@/lib/mappers";
import type { Market } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  if (db) {
    try {
      const rows = await db.listMarkets();
      if (rows.length > 0) {
        return Response.json(rows.map(marketRowToMarket));
      }
    } catch (err) {
      console.error("[api/markets] Supabase read failed, falling back to mock:", err);
    }
  }
  const markets: Market[] = fallbackMarkets();
  return Response.json(markets);
}
