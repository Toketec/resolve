// GET /api/agents/[id] — 单个 Agent 详情
import { getDb } from "@/lib/supabase-server";
import { agentRowToAgent } from "@/lib/mappers";

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
      console.error(`[api/agents/${id}] Supabase read failed:`, err);
    }
  }

  return Response.json({ error: "Agent not found" }, { status: 404 });
}
