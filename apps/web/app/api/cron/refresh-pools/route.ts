// GET /api/cron/refresh-pools — 遍历所有 active 市场，从链上刷新池状态到 Supabase
// 逐个处理，失败跳过不影响其他市场
import { getDb } from "@/lib/supabase-server";
import { getPoolState, normalizePoolState } from "@/lib/contract/settlement";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  if (!db) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  const results: Array<{ slug: string; ok: boolean; error?: string }> = [];

  try {
    const markets = await db.listMarkets();
    const active = markets.filter((m) => m.status === "active");

    for (const m of active) {
      try {
        const pool = await getPoolState(m.slug);
        const np = normalizePoolState(pool);
        await db.upsertPoolState({
          market_id: m.id,
          yes_price: np.yesPrice,
          no_price: np.noPrice,
          yes_supply: np.yesSupply,
          no_supply: np.noSupply,
          liquidity: np.liquidity,
          fee_pool: np.feePool,
        });
        results.push({ slug: m.slug, ok: true });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[refresh-pools] ${m.slug} failed:`, msg);
        results.push({ slug: m.slug, ok: false, error: msg });
      }
    }

    const refreshed = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;

    return Response.json({ refreshed, failed, total: active.length, results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[refresh-pools] listMarkets failed:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
