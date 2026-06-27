import type { Market, AIConsensus, AgentVote, Outcome } from "@resolve/shared";

export async function resolveMarket(market: Market): Promise<AIConsensus> {
  const startedAt = new Date().toISOString();
  const votes: AgentVote[] = [
    { agentId: "agent-1", callsign: "BULL-1", vote: "YES", confidence: 0.82, evidence: [{ source: "Mock", url: "#", snippet: "Sample", timestamp: new Date().toISOString(), kind: "news" }], decidedAt: new Date().toISOString() },
    { agentId: "agent-2", callsign: "BEAR-1", vote: "NO", confidence: 0.45, evidence: [{ source: "Mock", url: "#", snippet: "Sample", timestamp: new Date().toISOString(), kind: "news" }], decidedAt: new Date().toISOString() },
    { agentId: "agent-3", callsign: "NEUT-1", vote: "YES", confidence: 0.71, evidence: [{ source: "Mock", url: "#", snippet: "Sample", timestamp: new Date().toISOString(), kind: "news" }], decidedAt: new Date().toISOString() },
  ];
  const yesW = votes.filter(v => v.vote === "YES").reduce((s, v) => s + v.confidence, 0);
  const noW = votes.filter(v => v.vote === "NO").reduce((s, v) => s + v.confidence, 0);
  const total = yesW + noW;
  const outcome: Outcome = yesW >= noW ? "YES" : "NO";
  const confidence = total > 0 ? Math.max(yesW, noW) / total : 0;
  return { status: confidence >= 0.65 ? "consensus" : "dispute", outcome, confidence, threshold: 0.65, votes, startedAt, finalizedAt: new Date().toISOString() };
}
