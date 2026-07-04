// ─────────────────────────────────────────────
// 数据映射层 — DB Row ⇄ @resolve/shared 形状
// ─────────────────────────────────────────────
// Supabase 表的列名（question / expires_at / status:active|settled）与前端
// Market 类型（title / expiresAt / status:live|resolved）不同，且前端还需要
// 展示字段（yesPrice / volumeUSD / history / category…）。本模块负责双向转换，
// 并在 Supabase 未配置时提供 mock 兜底数据集（复用 lib/mock，不另造数据）。
// ─────────────────────────────────────────────

import type { Market, Agent, MarketStatus, Outcome, PricePoint } from "@/lib/types";
import type { MarketRow, AgentRow, PoolStateRow } from "@resolve/db";
import { MOCK_MARKETS } from "@/lib/mock";
import { getAgentAddress } from "@/lib/bai/agent-registry";

// ── status 枚举映射 ───────────────────────────────────────────
// DB: 'active' | 'resolving' | 'resolved' | 'settled'
// FE: 'live'   | 'resolving' | 'resolved' | 'disputed'
function mapStatus(dbStatus: MarketRow["status"]): MarketStatus {
  switch (dbStatus) {
    case "active":
      return "live";
    case "resolving":
      return "resolving";
    case "resolved":
    case "settled":
      return "resolved";
    default:
      return "live";
  }
}

// 确定性伪随机（与 lib/mock 一致的图表生成思路，保证 SSR/CSR 稳定）
function seeded(seed: number) {
  let s = seed % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateHistory(seed: number, end: number, target: number, points = 60): PricePoint[] {
  const rng = seeded(seed || 1);
  const series: PricePoint[] = [];
  let v = 0.5;
  const stepSecs = (7 * 24 * 60 * 60) / points;
  for (let i = 0; i < points; i++) {
    const drift = (target - v) * 0.04;
    const noise = (rng() - 0.5) * 0.08;
    v = Math.max(0.02, Math.min(0.98, v + drift + noise));
    series.push({ t: end - (points - i) * stepSecs, yes: v });
  }
  return series;
}

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 233280;
  return h;
}

/**
 * DB MarketRow → 前端 Market。
 *
 * DB 只存核心字段（slug/question/status/expires_at…），展示字段（yesPrice/
 * volume/liquidity/traders/history/category/creator）DB 没有 —— 用确定性
 * 派生值补齐，使 UI 渲染与原 mock 形状完全一致。若某 slug 恰好在 mock 中存在，
 * 优先复用 mock 的展示值（让英雄市场视觉稳定）。
 */
export function marketRowToMarket(row: MarketRow, poolState?: PoolStateRow | null): Market {
  const fromMock = MOCK_MARKETS.find(
    (m) => m.slug === row.slug || m.slug === normalizeSlug(row.slug),
  );
  const seed = hashString(row.slug);
  // 优先使用 DB 池状态真实价格，否则回退 mock 派生值
  const yesPrice = poolState
    ? Number(poolState.yes_price)
    : (fromMock?.yesPrice ?? 0.5 + ((seed % 40) - 20) / 100);
  const expiresAt = row.expires_at ?? fromMock?.expiresAt ?? new Date().toISOString();
  const end = Math.floor(new Date(expiresAt).getTime() / 1000);
  const status = mapStatus(row.status);

  return {
    id: row.id,
    slug: row.slug,
    title: row.question,
    description: row.description || fromMock?.description || "",
    resolutionCriteria:
      fromMock?.resolutionCriteria ??
      "AI agents independently gather evidence and reach a weighted consensus. Threshold 0.65.",
    category: fromMock?.category ?? "crypto",
    status,
    resolvedOutcome: (row.resolved_outcome as Outcome | null) ?? fromMock?.resolvedOutcome,
    createdAt: row.created_at,
    expiresAt,
    resolvedAt: status === "resolved" ? row.updated_at : fromMock?.resolvedAt,
    yesPrice,
    volumeUSD: fromMock?.volumeUSD ?? 1_000_000 + (seed % 9) * 480_000,
    liquidityUSD: poolState
      ? Number(poolState.liquidity) / 1e6
      : (fromMock?.liquidityUSD ?? 100_000 + (seed % 7) * 60_000),
    traders: fromMock?.traders ?? 400 + (seed % 50) * 80,
    history: fromMock?.history ?? generateHistory(seed, end, yesPrice),
    creator: fromMock?.creator ?? { name: "resolve.eth", address: "TR9ZDVVStpH5BgzqSqUYqyZgMYPRmvQGkp" },
    imageHint: fromMock?.imageHint ?? "₿",
    consensus: fromMock?.consensus,
    settlementTxHash: row.settlement_tx_hash ?? null,
  };
}

/** 把 DB 英雄市场 slug（btc-150k-eoy）规整为前端 slug（btc-150k-2026）。 */
export function normalizeSlug(slug: string): string {
  if (slug === "btc-150k-eoy") return "btc-150k-2026";
  return slug;
}

// ─────────────────────────────────────────────
// Agent 映射
// ─────────────────────────────────────────────

// API 返回的 Agent 是前端 Agent 的超集：额外带 DB 字段（role/stance/powered_by/8004）
export interface ApiAgent extends Agent {
  agentId: string;
  roleLabel: string;
  tier: "active" | "standby";
  stance: "BULL" | "BEAR" | "NEUT";
  poweredBy: string;
  ba8004Id: string | null;
}

// B.AI 8004 链上身份 ID（确定性派生，供 UI 展示 + Tronscan 链接）
// 真实集成时替换为 B.AI 8004 注册返回的链上 agent id。
export function derive8004Id(agentId: string): string {
  const seed = hashString(agentId);
  const reg = 8004;
  const idx = (seed % 900) + 100; // 100–999
  return `8004:${reg}-${idx}`;
}

export function agentRowToAgent(row: AgentRow): ApiAgent {
  const seed = hashString(row.agent_id);
  return {
    id: row.agent_id,
    name: row.role_label,
    callsign: row.name,
    kind: row.role as Agent["kind"],
    description: row.description,
    modelHint: row.powered_by ?? "GPT",
    region: ["ap-south-1", "eu-west-2", "us-east-1", "us-west-2", "eu-central-1", "ap-northeast-1"][seed % 6],
    uptimePct: 0.997 + (seed % 25) / 10000,
    resolutions: 700 + (seed % 60) * 90,
    accuracyPct: 0.96 + (seed % 35) / 1000,
    avgConfidence: 0.88 + (seed % 10) / 100,
    status: "online",
    agentId: row.agent_id,
    roleLabel: row.role_label,
    tier: row.tier,
    stance: row.stance,
    poweredBy: row.powered_by ?? "GPT",
    ba8004Id: getAgentAddress(row.agent_id, row.ba_8004_id) ?? derive8004Id(row.agent_id),
  };
}

/** 兜底市场列表 —— 直接用 lib/mock 的 8 个市场。 */
export function fallbackMarkets(): Market[] {
  return MOCK_MARKETS;
}

export function fallbackMarketBySlug(slug: string): Market | undefined {
  const want = normalizeSlug(slug);
  return MOCK_MARKETS.find((m) => m.slug === slug || m.slug === want);
}
