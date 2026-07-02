// ─────────────────────────────────────────────
// 加权共识数学 — Weighted Consensus
// ─────────────────────────────────────────────
// 6 票按 oracle 角色加权：YES 加权和 / (YES + NO 加权和) = consensus_score。
// score ≥ threshold(0.65) → 达成共识。可独立测试。
// ─────────────────────────────────────────────

import type { AgentVote, AIConsensus, Outcome } from "@resolve/shared";

// 角色权重（交易所/链上信号权重最高，叙事类略低）
export const ROLE_WEIGHTS: Record<string, number> = {
  "exchange-oracle": 1.0,
  "onchain-oracle": 0.9,
  "macro-oracle": 0.9,
  "tech-oracle": 0.8,
  "media-oracle": 0.8,
  "regulation-oracle": 0.8,
};

export const DEFAULT_THRESHOLD = 0.65;

export interface WeightedVote extends AgentVote {
  role: string;
}

export interface ConsensusResult {
  outcome: Outcome;
  /** 胜方加权占比 [0,1] */
  consensusScore: number;
  status: AIConsensus["status"];
  yesWeight: number;
  noWeight: number;
}

/** 对一组带角色的投票计算加权共识。 */
export function computeConsensus(
  votes: WeightedVote[],
  threshold = DEFAULT_THRESHOLD,
): ConsensusResult {
  let yesW = 0;
  let noW = 0;
  for (const v of votes) {
    const w = ROLE_WEIGHTS[v.role] ?? 1;
    const contribution = w * v.confidence;
    if (v.vote === "YES") yesW += contribution;
    else noW += contribution;
  }
  const total = yesW + noW;
  const outcome: Outcome = yesW >= noW ? "YES" : "NO";
  const consensusScore = total > 0 ? Math.max(yesW, noW) / total : 0;
  const status: AIConsensus["status"] =
    consensusScore >= threshold ? "consensus" : "dispute";
  return { outcome, consensusScore, status, yesWeight: yesW, noWeight: noW };
}
