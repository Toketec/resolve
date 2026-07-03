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
  yes_balance: number;
  no_balance: number;
  total_bought: number;
  total_sold: number;
  created_at: string;
  updated_at: string;
}

export interface TradeRow {
  id: string;
  market_id: string;
  wallet_address: string;
  side: 'YES' | 'NO';
  type: 'buy' | 'sell';
  shares: number;
  price: number;
  usdd_amount: number;
  fee: number;
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

export interface AgentRow {
  id: string;
  agent_id: string;
  name: string;
  role: string;
  role_label: string;
  tier: 'active' | 'standby';
  stance: 'BULL' | 'BEAR' | 'NEUT';
  weight: number;
  description: string;
  provider: string;
  status: 'idle' | 'thinking' | 'voted';
  confidence: number | null;
  last_vote: 'YES' | 'NO' | 'ABSTAIN' | null;
  evidence_summary: string | null;
  ba_8004_id: string | null;
  powered_by: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PoolStateRow {
  id: string;
  market_id: string;
  yes_price: number;
  no_price: number;
  yes_supply: string;
  no_supply: string;
  liquidity: string;
  fee_pool: string;
  source: string;
  updated_at: string;
}
