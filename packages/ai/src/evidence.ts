// ─────────────────────────────────────────────
// 精选证据集 — Curated Evidence Sets
// ─────────────────────────────────────────────
// 英雄市场（BTC $150K EOY 2026）的预取证据，按预言机类型分组。
// 使用预取/精选数据而非实时抓取，以保证 demo 的稳定性与确定性。
// 每条证据后续会被映射为 @resolve/shared 的 Evidence 结构。
// ─────────────────────────────────────────────

import type { Evidence } from "@resolve/shared";

export interface EvidenceSource {
  source: string;
  url: string;
  snippet: string;
  kind: Evidence["kind"];
}

export interface MarketEvidence {
  marketId: string;
  question: string;
  /** 按 oracle 角色分组的证据 */
  byRole: Record<string, EvidenceSource[]>;
  /** 所有 agent 共享的市场背景 */
  shared: EvidenceSource[];
}

const NOW_ISO = () => new Date().toISOString();

// 英雄市场证据集（BTC $150K by Dec 31, 2026）
const BTC_150K: MarketEvidence = {
  marketId: "mk_btc_150k",
  question: "Will Bitcoin close above $150,000 by Dec 31, 2026?",
  shared: [
    {
      source: "Market context",
      url: "https://www.htx.com/en-us/markets",
      snippet:
        "BTC is the flagship RESOLVE market. Threshold is a year-end 2026 daily close ≥ $150,000. Multiple independent oracles weigh exchange, on-chain, media, regulatory, and macro signals.",
      kind: "api",
    },
  ],
  byRole: {
    // 交易所预言机（BULL-1）：HTX 价格/成交量/订单簿
    "exchange-oracle": [
      {
        source: "HTX Spot",
        url: "https://www.htx.com/en-us/trade/btc_usdt",
        snippet:
          "BTC/USDT spot trading near six-figure levels with healthy 24h volume; order book shows firm bid-side depth and rising taker-buy ratio on HTX.",
        kind: "api",
      },
      {
        source: "HTX Order Book",
        url: "https://www.htx.com/en-us/trade/btc_usdt",
        snippet:
          "Cumulative bid depth within 2% of mid exceeds ask depth, indicating accumulation; no large sell walls below the prior range high.",
        kind: "api",
      },
      {
        source: "Technicals",
        url: "https://www.tradingview.com/symbols/BTCUSD/",
        snippet:
          "BTC holding above the 200-day moving average; weekly structure prints higher lows. A path to $150K requires roughly a 50% advance from current spot over the horizon.",
        kind: "api",
      },
    ],
    // 技术预言机（BULL-2）：基本面/网络/采用
    "tech-oracle": [
      {
        source: "Mempool / Network",
        url: "https://mempool.space",
        snippet:
          "Hashrate at all-time highs and steady; network security and miner commitment remain strong, supporting the long-term bull thesis.",
        kind: "onchain",
      },
      {
        source: "Adoption",
        url: "https://www.blockchain.com/explorer",
        snippet:
          "Sustained growth in active addresses and L2/TEE settlement throughput points to expanding utility and structural demand.",
        kind: "onchain",
      },
    ],
    // 媒体预言机（BEAR-1）：新闻情绪/宏观风险
    "media-oracle": [
      {
        source: "Reuters",
        url: "https://www.reuters.com/markets/cryptocurrency/",
        snippet:
          "Coverage is mixed: spot-ETF inflows are cited as structurally bullish, but commentators warn that a 50% rally to $150K within the window is an aggressive target amid macro uncertainty.",
        kind: "news",
      },
      {
        source: "Bloomberg",
        url: "https://www.bloomberg.com/crypto",
        snippet:
          "Analysts note elevated implied volatility and caution that rate-path surprises could cap upside before year-end.",
        kind: "news",
      },
    ],
    // 监管预言机（BEAR-2）：监管政策
    "regulation-oracle": [
      {
        source: "SEC.gov",
        url: "https://www.sec.gov/news/pressreleases",
        snippet:
          "Spot BTC ETFs are approved and trading, a constructive backdrop; however, periodic enforcement headlines remain a tail risk to sentiment.",
        kind: "official",
      },
      {
        source: "ESMA / MiCA",
        url: "https://www.esma.europa.eu",
        snippet:
          "MiCA implementation is providing regulatory clarity in the EU, modestly de-risking institutional participation over the medium term.",
        kind: "official",
      },
    ],
    // 链上预言机（NEUT-1）：链上数据/巨鲸
    "onchain-oracle": [
      {
        source: "Glassnode",
        url: "https://glassnode.com",
        snippet:
          "Exchange balances trending down (net outflows) and long-term-holder supply rising — historically a constructive, though not deterministic, accumulation signal.",
        kind: "onchain",
      },
      {
        source: "Whale Watch",
        url: "https://whale-alert.io",
        snippet:
          "Large wallets show net accumulation over the trailing quarter; no sustained distribution from top cohorts detected.",
        kind: "onchain",
      },
    ],
    // 宏观预言机（NEUT-2）：宏观经济/利率
    "macro-oracle": [
      {
        source: "FRED",
        url: "https://fred.stlouisfed.org",
        snippet:
          "Liquidity conditions easing modestly; the rate path is the dominant swing factor for risk assets into year-end 2026.",
        kind: "api",
      },
      {
        source: "Macro",
        url: "https://www.imf.org",
        snippet:
          "Base case is a soft landing with gradual easing — mildly supportive for risk assets, with geopolitics as the key downside tail.",
        kind: "api",
      },
    ],
  },
};

const REGISTRY: Record<string, MarketEvidence> = {
  mk_btc_150k: BTC_150K,
  "btc-150k-2026": BTC_150K,
  "btc-150k-eoy": BTC_150K,
};

/** 取某市场的证据集；未知市场回退到英雄市场结构（demo 容错）。 */
export function getEvidenceForMarket(marketIdOrSlug: string): MarketEvidence {
  return REGISTRY[marketIdOrSlug] ?? BTC_150K;
}

/** 把某 oracle 角色的证据（含共享背景）转为 @resolve/shared Evidence。 */
export function toEvidence(sources: EvidenceSource[]): Evidence[] {
  const ts = NOW_ISO();
  return sources.map((s) => ({
    source: s.source,
    url: s.url,
    snippet: s.snippet,
    timestamp: ts,
    kind: s.kind,
  }));
}
