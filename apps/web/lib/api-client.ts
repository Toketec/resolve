// ─────────────────────────────────────────────
// API 客户端 — 前端调用 /api/* 的薄封装
// ─────────────────────────────────────────────
// 客户端组件用相对路径；服务端组件需绝对 URL（从 env 派生）。
// 所有方法在失败时抛错，调用方负责 loading/error/兜底。
// ─────────────────────────────────────────────

import type { Market, AIConsensus, Outcome, Position, Trade } from "@/lib/types";
import type { ApiAgent } from "@/lib/mappers";

/** 服务端绝对 base；客户端返回空串（相对路径）。 */
function baseUrl(): string {
  if (typeof window !== "undefined") return "";
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const port = process.env.PORT || "3000";
  return `http://localhost:${port}`;
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, { cache: "no-store", ...init });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    ...init,
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

// ── 业务方法 ──────────────────────────────────────────────────

export function fetchMarkets(): Promise<Market[]> {
  return apiGet<Market[]>("/api/markets");
}

export function fetchMarket(slug: string): Promise<Market> {
  return apiGet<Market>(`/api/markets/${slug}`);
}

export function fetchAgents(): Promise<ApiAgent[]> {
  return apiGet<ApiAgent[]>("/api/agents");
}

export function fetchAgent(id: string): Promise<ApiAgent> {
  return apiGet<ApiAgent>(`/api/agents/${id}`);
}

/** 触发 AI 共识（6 Agent 并行推理，可能耗时数十秒）。 */
export function resolveMarketConsensus(slug: string): Promise<AIConsensus> {
  return apiGet<AIConsensus>(`/api/markets/${slug}/resolve`);
}

export interface BuyResponse {
  id: string;
  marketId: string;
  side: Outcome;
  shares: number;
  amount: number;
  price?: number;
  txHash: string;
  walletAddress: string;
  status: string;
  persisted: boolean;
}

export function buyShares(input: {
  marketId: string;
  side: Outcome;
  amount: number;
  shares?: number;
  price?: number;
  walletAddress: string;
  txHash: string;
}): Promise<BuyResponse> {
  return apiPost<BuyResponse>("/api/buy", input);
}

export interface SellResponse {
  id: string;
  marketId: string;
  side: Outcome;
  shares: number;
  usddAmount: number;
  price: number;
  txHash: string;
  walletAddress: string;
  status: string;
  persisted: boolean;
}

export function sellShares(input: {
  marketId: string;
  side: Outcome;
  shares: number;
  usddAmount: number;
  price: number;
  walletAddress: string;
  txHash: string;
}): Promise<SellResponse> {
  return apiPost<SellResponse>("/api/sell", input);
}

export interface SettleResponse {
  marketId: string;
  outcome: Outcome;
  txHash: string;
  paidOut: boolean;
  simulated: boolean;
  winnerCount?: number;
  totalPayout?: string;
  note?: string;
}

export function settle(input: {
  marketId: string;
  outcome: Outcome;
  winnerWallet?: string;
  payoutSun?: string;
}): Promise<SettleResponse> {
  return apiPost<SettleResponse>("/api/settle", input);
}

export interface PriceSnapshot {
  symbol: string;
  pair: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  vol24h: number;
  source: string;
  at: string;
}

export function fetchPrice(symbol: string): Promise<PriceSnapshot> {
  return apiGet<PriceSnapshot>(`/api/price/${symbol}`);
}

// ── 持仓 & 交易历史 ──────────────────────────────────────────

export function fetchPositions(wallet: string): Promise<Position[]> {
  return apiGet<Position[]>(`/api/positions?wallet=${encodeURIComponent(wallet)}`);
}

export function fetchTrades(wallet: string): Promise<Trade[]> {
  return apiGet<Trade[]>(`/api/trades?wallet=${encodeURIComponent(wallet)}`);
}

export function fetchMarketTrades(slug: string): Promise<Trade[]> {
  return apiGet<Trade[]>(`/api/markets/${encodeURIComponent(slug)}/trades`);
}

