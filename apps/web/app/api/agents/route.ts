// GET /api/agents — Agent 列表（6 个全 ACTIVE）
import { getDb } from "@/lib/supabase-server";
import { agentRowToAgent } from "@/lib/mappers";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  if (db) {
    try {
      const rows = await db.listAgents();
      if (rows.length > 0) {
        return Response.json(rows.map(agentRowToAgent));
      }
    } catch (err) {
      console.error("[api/agents] Supabase read failed:", err);
    }
  }
  return Response.json([]);
}
