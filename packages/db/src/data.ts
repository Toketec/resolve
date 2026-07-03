// ─────────────────────────────────────────────
// 数据访问层 — Data Access Layer
// ─────────────────────────────────────────────
// 所有 Supabase 数据库操作集中在此，API Routes 调用这些函数。
//
// 遵循「后端真实数据」原则：本层不填充 mock 数据。
// 如果查询结果为空/0/null，由前端数据层决定是否填 mock。
// ─────────────────────────────────────────────

import { getAnyClient } from './client';
import type {
  MarketRow,
  PositionRow,
  AgentConsensusRow,
  AgentVoteRow,
  AgentRow,
} from './types';

// ── 市场 (markets) ─────────────────────────────────────────

/** 获取所有市场 */
export async function listMarkets(): Promise<MarketRow[]> {
  const { data, error } = await getAnyClient()
    .from('markets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to list markets: ${error.message}`);
  return (data ?? []) as MarketRow[];
}

/** 按 slug 获取单个市场 */
export async function getMarketBySlug(slug: string): Promise<MarketRow | null> {
  const { data, error } = await getAnyClient()
    .from('markets')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data as MarketRow;
}

/** 创建新市场（id / created_at / updated_at 由 Supabase 自动生成） */
export async function insertMarket(input: {
  slug: string;
  question: string;
  description: string;
  status?: MarketRow["status"];
  expires_at?: string | null;
  resolved_outcome?: MarketRow["resolved_outcome"];
  settlement_tx_hash?: string | null;
}): Promise<MarketRow> {
  const { data, error } = await getAnyClient()
    .from("markets")
    .insert({
      ...input,
      status: input.status ?? "active",
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create market: ${error.message}`);
  return data as MarketRow;
}

/** 更新市场状态或结果 */
export async function updateMarket(
  id: string,
  updates: Record<string, unknown>,
): Promise<void> {
  const { error } = await getAnyClient()
    .from('markets')
    .update(updates)
    .eq('id', id);

  if (error) throw new Error(`Failed to update market: ${error.message}`);
}

// ── 仓位 (positions) ─────────────────────────────────────────

/** 获取某市场下某钱包的仓位 */
export async function getPosition(
  marketId: string,
  walletAddress: string,
): Promise<PositionRow | null> {
  const { data, error } = await getAnyClient()
    .from('positions')
    .select('*')
    .eq('market_id', marketId)
    .eq('wallet_address', walletAddress)
    .single();

  if (error) return null;
  return data as PositionRow;
}

/** 按钱包地址获取该钱包下所有持仓（按创建时间倒序） */
export async function listPositionsByWallet(
  walletAddress: string,
): Promise<PositionRow[]> {
  const { data, error } = await getAnyClient()
    .from('positions')
    .select('*, markets(*)')
    .eq('wallet_address', walletAddress)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to list positions by wallet: ${error.message}`);
  return (data ?? []) as PositionRow[];
}

/** 记录新仓位 */
export async function insertPosition(input: {
  market_id: string;
  wallet_address: string;
  side: 'YES' | 'NO';
  amount: number;
  tx_hash?: string;
}): Promise<PositionRow> {
  const { data, error } = await getAnyClient()
    .from('positions')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(`Failed to insert position: ${error.message}`);
  return data as PositionRow;
}

// ── 共识 (agent_consensus) ─────────────────────────────────────

/** 获取某市场的最新共识结果 */
export async function getLatestConsensus(
  marketId: string,
): Promise<AgentConsensusRow | null> {
  const { data, error } = await getAnyClient()
    .from('agent_consensus')
    .select('*')
    .eq('market_id', marketId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data as AgentConsensusRow;
}

/** 插入新的共识结果 */
export async function insertConsensus(
  input: Record<string, unknown>,
): Promise<AgentConsensusRow> {
  const { data, error } = await getAnyClient()
    .from('agent_consensus')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(`Failed to insert consensus: ${error.message}`);
  return data as AgentConsensusRow;
}

// ── Agent 投票 (agent_votes) ───────────────────────────────────
/** 获取某次共识的所有 Agent 投票 */
export async function getConsensusVotes(
  consensusId: string,
): Promise<AgentVoteRow[]> {
  const { data, error } = await getAnyClient()
    .from('agent_votes')
    .select('*')
    .eq('consensus_id', consensusId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to get votes: ${error.message}`);
  return (data ?? []) as AgentVoteRow[];
}

/** 批量插入 Agent 投票 */
export async function insertVotes(
  input: Record<string, unknown>[],
): Promise<AgentVoteRow[]> {
  const { data, error } = await getAnyClient()
    .from('agent_votes')
    .insert(input)
    .select();

  if (error) throw new Error(`Failed to insert votes: ${error.message}`);
  return (data ?? []) as AgentVoteRow[];
}

// ── Agent 定义 (agents) ────────────────────────────────────────

/** 获取所有 Agent（按 sort_order 排序） */
export async function listAgents(): Promise<AgentRow[]> {
  const { data, error } = await getAnyClient()
    .from('agents')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`Failed to list agents: ${error.message}`);
  return (data ?? []) as AgentRow[];
}

/** 按 agent_id 获取单个 Agent */
export async function getAgentById(agentId: string): Promise<AgentRow | null> {
  const { data, error } = await getAnyClient()
    .from('agents')
    .select('*')
    .eq('agent_id', agentId)
    .single();

  if (error) return null;
  return data as AgentRow;
}
