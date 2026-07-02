// GET /api/agents/[id] — 单个 Agent 详情
import { getDb } from "@/lib/supabase-server";
import { agentRowToAgent, FALLBACK_AGENTS } from "@/lib/mappers";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const db = getDb();
  if (db) {
    try {
      const row = await db.getAgentById(id);
      if (row) return Response.json(agentRowToAgent(row));
    } catch (err) {
      console.error(`[api/agents/${id}] Supabase read failed, falling back:`, err);
    }
  }

  const agent = FALLBACK_AGENTS.find((a) => a.agentId === id || a.id === id);
  if (!agent) {
    return Response.json({ error: "Agent not found" }, { status: 404 });
  }
  return Response.json(agent);
}
