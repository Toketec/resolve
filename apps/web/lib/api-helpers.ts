// ─────────────────────────────────────────────
// API 辅助函数 — 池状态后台刷新等
// ─────────────────────────────────────────────
import { getDb } from "@/lib/supabase-server";
import { getPoolState, normalizePoolState } from "@/lib/contract/settlement";

/**
 * 在交易成功后异步刷新对应市场的池状态到 DB。
 * 使用 fire-and-forget 模式：不阻塞主响应，失败静默丢弃。
 */
export async function refreshPoolStateInBackground(marketId: string): Promise<void> {
  try {
    const db = getDb();
    if (!db) return;

    // 从 marketId (UUID) 查找 slug
    const market = await db.getMarketById(marketId);
    if (!market) return;

    const pool = await getPoolState(market.slug);
    const np = normalizePoolState(pool);

    await db.upsertPoolState({
      market_id: marketId,
      yes_price: np.yesPrice,
      no_price: np.noPrice,
      yes_supply: np.yesSupply,
      no_supply: np.noSupply,
      liquidity: np.liquidity,
      fee_pool: np.feePool,
    });
  } catch {
    // 静默失败，不影响交易主流程
  }
}
