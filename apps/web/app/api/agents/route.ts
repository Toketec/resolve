// GET /api/agents — Agent 列表（6 个全 ACTIVE）
// 优先读 DB；无 DB 或异常时回退 mock 数据（与 /api/markets 一致）
import { getDb } from "@/lib/supabase-server";
import { agentRowToAgent, derive8004Id } from "@/lib/mappers";
import { MOCK_AGENTS } from "@/lib/mock/agents";
import type { ApiAgent } from "@/lib/mappers";

export const dynamic = "force-dynamic";

/** 将 mock agents 转为 ApiAgent 形状作为 API 兜底 */
function fallbackAgents(): ApiAgent[] {
  return MOCK_AGENTS.map((a) => ({
    ...a,
    agentId: a.id,
    roleLabel: a.kind,
    tier: "active" as const,
    stance: (a.tier ?? "NEUT") as "BULL" | "BEAR" | "NEUT",
    poweredBy: a.modelHint,
    ba8004Id: derive8004Id(a.id),
  }));
}

export async function GET() {
  const db = getDb();
  if (db) {
    try {
      const rows = await db.listAgents();
      if (rows.length > 0) {
        return Response.json(rows.map(agentRowToAgent));
      }
    } catch (err) {
      console.error("[api/agents] Supabase read failed, falling back to mock:", err);
    }
  }
  return Response.json(fallbackAgents());
}
