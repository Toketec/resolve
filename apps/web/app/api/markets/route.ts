// GET /api/markets — 市场列表
// POST /api/markets — 创建新市场
// Supabase 已配置 → 读/写 markets 表；否则回退 mock 数据集。
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

interface CreateMarketBody {
  slug: string;
  question: string;
  description: string;
  expires_at: string;
  settlement_tx_hash?: string; // 链上 createMarket 成功后传回
}

export async function POST(req: Request) {
  let body: CreateMarketBody;
  try {
    body = (await req.json()) as CreateMarketBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { slug, question, description, expires_at, settlement_tx_hash } = body;
  if (!slug || !question) {
    return Response.json(
      { error: "Missing required fields: slug, question" },
      { status: 400 },
    );
  }

  const db = getDb();
  if (!db) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  // 检查 slug 冲突
  try {
    const existing = await db.getMarketBySlug(slug);
    if (existing) {
      return Response.json(
        { error: "Market with this slug already exists" },
        { status: 409 },
      );
    }
  } catch {
    // getMarketBySlug 失败（如 slug 不存在）→ 可继续创建
  }

  try {
    const row = await db.insertMarket({
      slug,
      question,
      description: description || "",
      status: "active",
      expires_at: expires_at || null,
      settlement_tx_hash: settlement_tx_hash || null,
    });
    return Response.json(marketRowToMarket(row), { status: 201 });
  } catch (err) {
    console.error("[api/markets] Supabase insert failed:", err);
    return Response.json({ error: "Failed to create market" }, { status: 500 });
  }
}
