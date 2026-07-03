// GET /api/markets/[slug] — 单个市场详情
import { getDb } from "@/lib/supabase-server";
import { marketRowToMarket, fallbackMarketBySlug } from "@/lib/mappers";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const db = getDb();
  if (db) {
    try {
      const row = await db.getMarketBySlug(slug);
      if (row) {
        // 优先读 DB 池状态
        const poolState = await db.getPoolStateByMarketId(row.id);
        return Response.json(marketRowToMarket(row, poolState));
      }
    } catch (err) {
      console.error(`[api/markets/${slug}] Supabase read failed, falling back:`, err);
    }
  }

  const market = fallbackMarketBySlug(slug);
  if (!market) {
    return Response.json({ error: "Market not found" }, { status: 404 });
  }
  return Response.json(market);
}
