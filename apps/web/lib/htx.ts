// HTX 公开行情 API 工具 —— 符号映射 + 取数 + 离线兜底
// 前端传 "BTC"，HTX 需要 "btcusdt"（小写、无分隔符）。
// HTX 公开行情接口无需注册：https://api.htx.com/market/*
//
// 注意：部分网络环境无法直连 HTX（DNS/防火墙）。此时返回带 source:"fallback"
// 的合成数据，保证 dev/demo 不中断；生产环境（Vercel）可直连真实 HTX。

const HTX_HOSTS = ["https://api.htx.com", "https://api.huobi.pro"];

// HTX 公开行情响应的最小形状
export interface HtxTick {
  open?: number;
  close?: number;
  high?: number;
  low?: number;
  vol?: number;
  bids?: [number, number][];
  asks?: [number, number][];
}
export interface HtxKlinePoint {
  id: number;
  open: number;
  close: number;
  high: number;
  low: number;
  vol: number;
}
export interface HtxResponse {
  status?: string;
  tick?: HtxTick;
  data?: HtxKlinePoint[];
}

/** BTC → btcusdt；已是完整对（含 usdd/usdt）则原样小写。 */
export function toHtxSymbol(input: string): string {
  const s = input.trim().toLowerCase();
  if (s.includes("usd")) return s; // 已是交易对
  return `${s}usdt`;
}

/** 依次尝试 HTX 主机，超时 6s。全部失败抛错（调用方走兜底）。 */
export async function htxFetch(path: string): Promise<HtxResponse> {
  let lastErr: unknown;
  for (const host of HTX_HOSTS) {
    try {
      const res = await fetch(`${host}${path}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(6000),
        next: { revalidate: 5 },
      });
      if (!res.ok) throw new Error(`HTX ${path} → HTTP ${res.status}`);
      const json = (await res.json()) as HtxResponse;
      if (json?.status && json.status !== "ok") {
        throw new Error(`HTX ${path} → status ${json.status}`);
      }
      return json;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("HTX unreachable");
}

// ── 离线兜底（合成行情，source 标记为 fallback）──────────────────
// 基准价仅用于网络不可达时维持 demo 运行；带轻微时间抖动以非恒定。

const BASE_PRICE: Record<string, number> = {
  btc: 98000, eth: 3400, bnb: 600, sol: 180, trx: 0.24, doge: 0.16, htx: 0.0000012,
};

function basePriceFor(symbol: string): number {
  const key = symbol.trim().toLowerCase().replace(/usd[td]?$/, "");
  return BASE_PRICE[key] ?? 100;
}

function jitter(seed: number, pct = 0.01): number {
  // 基于当前分钟的确定性小幅波动，使价格非恒定
  const minute = Math.floor(Date.now() / 60000);
  const r = Math.sin(minute * (seed + 1)) * pct;
  return 1 + r;
}

export function fallbackPrice(symbol: string) {
  const base = basePriceFor(symbol);
  const price = base * jitter(1);
  const open = base * jitter(2);
  return {
    symbol: symbol.toUpperCase(),
    pair: toHtxSymbol(symbol),
    price: Number(price.toFixed(price < 1 ? 8 : 2)),
    change24h: Number((((price - open) / open) * 100).toFixed(2)),
    high24h: Number((Math.max(price, open) * 1.02).toFixed(2)),
    low24h: Number((Math.min(price, open) * 0.98).toFixed(2)),
    vol24h: 1.2e9,
    source: "fallback",
    at: new Date().toISOString(),
  };
}

export function fallbackDepth(symbol: string) {
  const base = basePriceFor(symbol) * jitter(1);
  const mk = (i: number, side: 1 | -1) => ({
    price: Number((base * (1 + side * i * 0.0005)).toFixed(base < 1 ? 8 : 2)),
    amount: Number((Math.abs(Math.sin(i + 1)) * 5 + 0.5).toFixed(4)),
  });
  return {
    symbol: symbol.toUpperCase(),
    pair: toHtxSymbol(symbol),
    bids: Array.from({ length: 20 }, (_, i) => mk(i + 1, -1)),
    asks: Array.from({ length: 20 }, (_, i) => mk(i + 1, 1)),
    source: "fallback",
    at: new Date().toISOString(),
  };
}

export function fallbackKline(symbol: string, size = 30) {
  const base = basePriceFor(symbol);
  const day = 86400;
  const nowSec = Math.floor(Date.now() / 1000);
  let v = base * 0.9;
  return {
    symbol: symbol.toUpperCase(),
    pair: toHtxSymbol(symbol),
    period: "1day",
    klines: Array.from({ length: size }, (_, i) => {
      const open = v;
      v = v * (1 + Math.sin(i * 1.3) * 0.02 + 0.003);
      const close = v;
      return {
        timestamp: nowSec - (size - i) * day,
        open: Number(open.toFixed(2)),
        close: Number(close.toFixed(2)),
        high: Number((Math.max(open, close) * 1.01).toFixed(2)),
        low: Number((Math.min(open, close) * 0.99).toFixed(2)),
        volume: Number((1e9 * (1 + Math.cos(i) * 0.1)).toFixed(0)),
      };
    }),
    source: "fallback",
    at: new Date().toISOString(),
  };
}
