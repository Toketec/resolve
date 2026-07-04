// ─────────────────────────────────────────────
// 服务端数据直连层 — Server Components 使用
// ─────────────────────────────────────────────
// Server Components 不应通过 HTTP fetch() 自调用 /api/*，
// 这种模式在 Vercel serverless 环境下极不稳定（经过边缘网络回源）。
//
// 本模块直接调用 @resolve/db（Supabase）或回退 lib/mock，
// 与 API Routes 内部的逻辑完全一致，但消除了网络跳转。
// ─────────────────────────────────────────────

import { getDb } from "@/lib/supabase-server";
import {
  marketRowToMarket,
  agentRowToAgent,
  fallbackMarkets,
  fallbackMarketBySlug,
  derive8004Id,
} from "@/lib/mappers";
import { MOCK_AGENTS, MOCK_TRADES } from "@/lib/mock";
import type { Market, Trade } from "@/lib/types";
import type { ApiAgent } from "@/lib/mappers";

// ── Markets ──────────────────────────────────────────────────

export async function getMarkets(): Promise<Market[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = await db.listMarkets();
      if (rows.length > 0) {
        const marketIds = rows.map((r) => r.id);
        const poolStates = await db.listLatestPoolStates(marketIds);
        return rows.map((row) => marketRowToMarket(row, poolStates.get(row.id)));
      }
    } catch (err) {
      console.error("[data-server] getMarkets failed, falling back to mock:", err);
    }
  }
  return fallbackMarkets();
}

export async function getMarketBySlug(slug: string): Promise<Market | undefined> {
  const db = getDb();
  if (db) {
    try {
      const row = await db.getMarketBySlug(slug);
      if (row) {
        const poolState = await db.getPoolStateByMarketId(row.id);
        return marketRowToMarket(row, poolState);
      }
    } catch (err) {
      console.error(`[data-server] getMarketBySlug("${slug}") failed, falling back:`, err);
    }
  }
  return fallbackMarketBySlug(slug);
}

// ── Agents ───────────────────────────────────────────────────

export async function getAgents(): Promise<ApiAgent[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = await db.listAgents();
      if (rows.length > 0) {
        return rows.map(agentRowToAgent);
      }
    } catch (err) {
      console.error("[data-server] getAgents failed, falling back to mock:", err);
    }
  }
  // 回退：将 mock agents 转为 ApiAgent 形状
  return MOCK_AGENTS.map((a) => ({
    ...a,
    agentId: a.id,
    roleLabel: a.kind,
    tier: "active" as const,
    stance: (a.tier ?? "NEUT") as "BULL" | "BEAR" | "NEUT",
    poweredBy: a.modelHint,
    ba8004Id: derive8004Id(a.id),
  }));
}

// ── Trades ───────────────────────────────────────────────────

import type { TradeRow } from "@resolve/db";

function rowToTrade(row: TradeRow): Trade {
  const market = fallbackMarkets().find((m) => m.id === row.market_id);
  return {
    id: row.id,
    marketId: row.market_id,
    marketTitle: market?.title ?? row.market_id,
    side: row.side,
    price: Number(row.price),
    shares: Number(row.shares),
    at: row.created_at,
    user: {
      name: `user_${row.wallet_address.slice(0, 6)}`,
      address: row.wallet_address,
    },
  };
}

export async function getMarketTrades(slug: string): Promise<Trade[]> {
  const db = getDb();
  if (db) {
    try {
      const market = await db.getMarketBySlug(slug);
      if (market) {
        const rows = await db.listTradesByMarket(market.id, 20);
        if (rows.length > 0) {
          return rows.map(rowToTrade);
        }
      }
    } catch (err) {
      console.error(`[data-server] getMarketTrades("${slug}") failed, falling back:`, err);
    }
  }
  // 回退 mock
  const mockMarket = fallbackMarkets().find((m) => m.slug === slug);
  return mockMarket
    ? MOCK_TRADES.filter((t) => t.marketId === mockMarket.id).slice(0, 8)
    : [];
}
