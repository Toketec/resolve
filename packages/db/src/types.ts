// ─────────────────────────────────────────────
// 数据库类型定义（纯业务类型，与 migration SQL 同步）
// ─────────────────────────────────────────────

export interface MarketRow {
  id: string;
  slug: string;
  question: string;
  description: string;
  status: 'active' | 'resolving' | 'resolved' | 'settled';
  expires_at: string | null;
  resolved_outcome: 'YES' | 'NO' | null;
  settlement_tx_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface PositionRow {
  id: string;
  market_id: string;
  wallet_address: string;
  side: 'YES' | 'NO';
  amount: number;
  tx_hash: string;
  created_at: string;
}

export type ConsensusOutcome = 'YES' | 'NO' | 'UNCERTAIN';

export interface AgentConsensusRow {
  id: string;
  market_id: string;
  outcome: ConsensusOutcome;
  yes_votes: number;
  no_votes: number;
  yes_confidence: number;
  no_confidence: number;
  consensus_score: number;
  threshold: number;
  total_agents: number;
  active_agents: number;
  evidence_summary: Record<string, unknown>;
  triggered_by: string;
  created_at: string;
}

export interface AgentVoteRow {
  id: string;
  consensus_id: string;
  agent_name: string;
  agent_role: string;
  vote: 'YES' | 'NO' | 'ABSTAIN';
  confidence: number;
  evidence: string;
  status: 'active' | 'standby';
  created_at: string;
}
