// GET /api/markets/[slug]/resolve — 触发 AI 共识
// 阶段 1：返回 mock AIConsensus（6 票，形状与 @resolve/shared 一致）。
// 阶段 3：替换为真实 resolveMarket()（6 Agent 并行 LLM 推理）。
import type { AIConsensus, AgentVote } from "@/lib/types";

export const dynamic = "force-dynamic";

const MOCK_VOTES: Omit<AgentVote, "decidedAt">[] = [
  {
    agentId: "bull-1", callsign: "BULL-1", vote: "YES", confidence: 0.86,
    evidence: [{ source: "HTX", url: "https://www.htx.com/en-us/trade/btc_usdd", snippet: "BTC reclaimed prior range high on rising HTX spot volume; orderbook bid depth firm.", timestamp: new Date().toISOString(), kind: "api" }],
  },
  {
    agentId: "bull-2", callsign: "BULL-2", vote: "YES", confidence: 0.78,
    evidence: [{ source: "L2BEAT", url: "https://l2beat.com", snippet: "TEE/L2 throughput and developer activity trending up — structurally bullish for adoption.", timestamp: new Date().toISOString(), kind: "onchain" }],
  },
  {
    agentId: "bear-1", callsign: "BEAR-1", vote: "NO", confidence: 0.62,
    evidence: [{ source: "Reuters", url: "https://www.reuters.com", snippet: "Macro headlines cite rate uncertainty; sentiment mixed despite ETF inflows.", timestamp: new Date().toISOString(), kind: "news" }],
  },
  {
    agentId: "bear-2", callsign: "BEAR-2", vote: "NO", confidence: 0.55,
    evidence: [{ source: "SEC.gov", url: "https://www.sec.gov", snippet: "Regulatory posture remains a tail risk; no resolution before year-end is plausible.", timestamp: new Date().toISOString(), kind: "official" }],
  },
  {
    agentId: "neut-1", callsign: "NEUT-1", vote: "YES", confidence: 0.71,
    evidence: [{ source: "Glassnode", url: "https://glassnode.com", snippet: "Exchange net outflows and accumulation by long-term holders lean constructive.", timestamp: new Date().toISOString(), kind: "onchain" }],
  },
  {
    agentId: "neut-2", callsign: "NEUT-2", vote: "YES", confidence: 0.66,
    evidence: [{ source: "FRED", url: "https://fred.stlouisfed.org", snippet: "Liquidity conditions easing on the margin; base case modestly risk-on.", timestamp: new Date().toISOString(), kind: "api" }],
  },
];

// 加权权重（与阶段 3 consensus.ts 对齐）
const WEIGHTS: Record<string, number> = {
  "bull-1": 1.0, "bull-2": 0.8, "bear-1": 0.8, "bear-2": 0.8, "neut-1": 0.9, "neut-2": 0.9,
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  await params; // slug 在阶段 3 用于选择证据集
  const now = new Date().toISOString();
  const votes: AgentVote[] = MOCK_VOTES.map((v) => ({ ...v, decidedAt: now }));

  let yesW = 0, noW = 0;
  for (const v of votes) {
    const w = WEIGHTS[v.agentId] ?? 1;
    if (v.vote === "YES") yesW += w * v.confidence;
    else noW += w * v.confidence;
  }
  const total = yesW + noW;
  const outcome = yesW >= noW ? "YES" : "NO";
  const confidence = total > 0 ? Math.max(yesW, noW) / total : 0;
  const threshold = 0.65;

  const consensus: AIConsensus = {
    status: confidence >= threshold ? "consensus" : "dispute",
    outcome,
    confidence,
    threshold,
    votes,
    startedAt: now,
    finalizedAt: now,
  };
  return Response.json(consensus);
}
