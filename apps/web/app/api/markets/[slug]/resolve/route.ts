// GET /api/markets/[slug]/resolve — 触发 AI 共识（真实 6 Agent 并行推理）
// 阶段 3：接入 @resolve/ai 的 resolveMarket()。无 OPENAI_API_KEY 时
// resolveMarket 内部 mock 兜底，不崩溃。
import { resolveMarket } from "@resolve/ai";
import { getDb } from "@/lib/supabase-server";
import { marketRowToMarket, fallbackMarketBySlug } from "@/lib/mappers";
import type { Market } from "@/lib/types";

export const dynamic = "force-dynamic";
// 6 次并行 LLM 调用（gpt-5.5 推理较慢），放宽函数超时
export const maxDuration = 120;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  // 取市场（真实数据源优先，否则 mock 兜底）
  let market: Market | undefined;
  const db = getDb();
  if (db) {
    try {
      const row = await db.getMarketBySlug(slug);
      if (row) market = marketRowToMarket(row);
    } catch {
      /* 落到 mock */
    }
  }
  if (!market) market = fallbackMarketBySlug(slug);
  if (!market) {
    return Response.json({ error: "Market not found" }, { status: 404 });
  }

  try {
    const consensus = await resolveMarket(market as unknown as import("@resolve/shared").Market);
    return Response.json(consensus);
  } catch (err) {
    console.error(`[api/markets/${slug}/resolve] resolve failed:`, err);
    return Response.json({ error: "Resolve failed" }, { status: 500 });
  }
}
