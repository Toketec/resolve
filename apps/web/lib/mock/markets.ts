import type { AIConsensus, Market, Trade } from "@/lib/types";
import { MOCK_AGENTS } from "./agents";

// Deterministic pseudo-random for stable mock charts.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateHistory(seed: number, end: number, points = 60, target = 0.62) {
  const rng = seeded(seed);
  const series: { t: number; yes: number }[] = [];
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

const NOW = Math.floor(Date.now() / 1000);
const DAY = 86400;

const baseMarkets: Omit<Market, "history" | "consensus">[] = [
  {
    id: "mk_btc_150k",
    slug: "btc-150k-2026",
    title: "Will Bitcoin close above $150,000 by Dec 31, 2026?",
    description:
      "Resolves YES if the daily Coinbase BTC/USD close on Dec 31, 2026 (00:00 UTC) is greater than or equal to $150,000.00. Resolves NO otherwise.",
    resolutionCriteria:
      "AI agents will cross-check the Coinbase, Kraken, and HTX BTC/USD daily close. Consensus threshold ≥ 0.75. Falls back to dispute window if confidence < threshold.",
    category: "crypto",
    status: "live",
    createdAt: new Date(NOW * 1000 - 14 * DAY * 1000).toISOString(),
    expiresAt: new Date(NOW * 1000 + 22 * DAY * 1000).toISOString(),
    yesPrice: 0.68,
    volumeUSD: 4_812_300,
    liquidityUSD: 612_000,
    traders: 4128,
    creator: { name: "satoshi.eth", address: "0xab12c4f5a9b3eD22b91F0e3F4dA9c1c00a4D8120" },
    imageHint: "₿",
  },
  {
    id: "mk_eth_etf_staking",
    slug: "eth-etf-staking",
    title: "Will the SEC approve in-kind ETH ETF staking before Q3 2026?",
    description:
      "Resolves YES if the SEC formally approves in-kind staking for any spot ETH ETF before Sept 30, 2026.",
    resolutionCriteria:
      "Resolves on official SEC.gov publication + at least one major newswire confirmation. Threshold 0.80.",
    category: "crypto",
    status: "live",
    createdAt: new Date(NOW * 1000 - 6 * DAY * 1000).toISOString(),
    expiresAt: new Date(NOW * 1000 + 95 * DAY * 1000).toISOString(),
    yesPrice: 0.41,
    volumeUSD: 1_902_400,
    liquidityUSD: 312_000,
    traders: 1740,
    creator: { name: "tradfi.lens", address: "0x9928bA48a2F5B311c0E5d3D9f5e8c34a2F11b6D2" },
    imageHint: "Ξ",
  },
  {
    id: "mk_apple_vp2",
    slug: "apple-vision-pro-2",
    title: "Will Apple announce Vision Pro 2 at WWDC 2026?",
    description:
      "Resolves YES if Apple officially announces a second-generation Vision Pro headset during the WWDC 2026 keynote.",
    resolutionCriteria:
      "Confirmed via apple.com press release + WWDC livestream + media wire. Threshold 0.78.",
    category: "tech",
    status: "live",
    createdAt: new Date(NOW * 1000 - 3 * DAY * 1000).toISOString(),
    expiresAt: new Date(NOW * 1000 + 4 * DAY * 1000).toISOString(),
    yesPrice: 0.57,
    volumeUSD: 712_000,
    liquidityUSD: 88_000,
    traders: 982,
    creator: { name: "marg.eth", address: "0xC4d8A9F12B0Ee3B8D52a9D1c4D8a9b3c4d5e6F70" },
    imageHint: "",
  },
  {
    id: "mk_election_2028",
    slug: "us-2028-dem-nominee",
    title: "Who will win the 2028 US Democratic nomination?",
    description:
      "Market on whether the named candidate will become the 2028 Democratic presidential nominee.",
    resolutionCriteria:
      "Resolves on Democratic National Convention nomination + AP race call confirmation. Threshold 0.85.",
    category: "politics",
    status: "live",
    createdAt: new Date(NOW * 1000 - 20 * DAY * 1000).toISOString(),
    expiresAt: new Date(NOW * 1000 + 380 * DAY * 1000).toISOString(),
    yesPrice: 0.31,
    volumeUSD: 9_104_000,
    liquidityUSD: 1_120_000,
    traders: 7240,
    creator: { name: "polipundit", address: "0xff80E1aA28E3bB1c4d8aD9F12B0aE3B8D52a9D1c4" },
    imageHint: "▲",
  },
  {
    id: "mk_la_rain",
    slug: "la-rain-march-2026",
    title: "Will LA receive over 2.0 inches of rainfall in March 2026?",
    description:
      "Resolves YES if total measured rainfall at Downtown LA station (USC) for March 2026 is >= 2.0 inches.",
    resolutionCriteria:
      "Cross-checked against NOAA + LA Almanac. Threshold 0.80.",
    category: "weather",
    status: "live",
    createdAt: new Date(NOW * 1000 - 9 * DAY * 1000).toISOString(),
    expiresAt: new Date(NOW * 1000 + 12 * DAY * 1000).toISOString(),
    yesPrice: 0.49,
    volumeUSD: 142_000,
    liquidityUSD: 22_500,
    traders: 412,
    creator: { name: "weatherwitch", address: "0x12ABc4f5a9b3eD22b91F0e3F4dA9c1c00a4D8120" },
    imageHint: "☂",
  },
  {
    id: "mk_lakers",
    slug: "lakers-playoffs-2026",
    title: "Will the LA Lakers make the 2026 NBA playoffs?",
    description:
      "Resolves YES if the Lakers qualify for the 2026 NBA playoffs (top-8 or play-in winner).",
    resolutionCriteria: "Official NBA.com bracket. Threshold 0.85.",
    category: "sports",
    status: "resolving",
    createdAt: new Date(NOW * 1000 - 40 * DAY * 1000).toISOString(),
    expiresAt: new Date(NOW * 1000 - 1 * 3600 * 1000).toISOString(),
    yesPrice: 0.81,
    volumeUSD: 2_402_000,
    liquidityUSD: 198_000,
    traders: 3211,
    creator: { name: "showtime", address: "0x77a8E9D12B0aE3B8D52a9D1c4D8a9F0bC4d8a9F1" },
    imageHint: "★",
  },
  {
    id: "mk_oscar_bp",
    slug: "oscar-best-picture-2026",
    title: "Will 'The Brutalist' win Best Picture at the 2026 Oscars?",
    description:
      "Resolves YES if 'The Brutalist' is announced as the Best Picture winner at the 98th Academy Awards.",
    resolutionCriteria: "Confirmed via Oscars.org + live broadcast wire. Threshold 0.80.",
    category: "entertainment",
    status: "resolved",
    resolvedOutcome: "NO",
    createdAt: new Date(NOW * 1000 - 90 * DAY * 1000).toISOString(),
    expiresAt: new Date(NOW * 1000 - 12 * DAY * 1000).toISOString(),
    resolvedAt: new Date(NOW * 1000 - 12 * DAY * 1000).toISOString(),
    yesPrice: 0.0,
    volumeUSD: 1_120_000,
    liquidityUSD: 0,
    traders: 1422,
    creator: { name: "filmstockpile", address: "0xABFA8E9D12B0aE3B8D52a9D1c4D8a9F0bC4d8a9F" },
    imageHint: "◇",
  },
  {
    id: "mk_fed_rate",
    slug: "fed-rate-cut-jun-2026",
    title: "Will the Fed cut rates at the June 2026 FOMC meeting?",
    description:
      "Resolves YES if the FOMC announces a target rate decrease at the conclusion of the June 17–18, 2026 meeting.",
    resolutionCriteria: "Official FOMC statement. Threshold 0.88.",
    category: "finance",
    status: "live",
    createdAt: new Date(NOW * 1000 - 4 * DAY * 1000).toISOString(),
    expiresAt: new Date(NOW * 1000 + 9 * DAY * 1000).toISOString(),
    yesPrice: 0.74,
    volumeUSD: 3_211_000,
    liquidityUSD: 412_000,
    traders: 2891,
    creator: { name: "ratesdesk", address: "0x88FAB48a2F5B311c0E5d3D9f5e8c34a2F11b6D88" },
    imageHint: "%",
  },
];

export const MOCK_MARKETS: Market[] = baseMarkets.map((m, i) => {
  const end = Math.floor(new Date(m.expiresAt).getTime() / 1000);
  const history = generateHistory(7 + i * 11, Math.min(end, NOW), 60, m.yesPrice);
  return {
    ...m,
    history,
    consensus: buildConsensus(m, i),
  };
});

function buildConsensus(m: Omit<Market, "history" | "consensus">, idx: number): AIConsensus | undefined {
  if (m.status === "live") {
    return {
      status: "pending" as const,
      confidence: 0,
      threshold: 0.65,
      votes: [],
      startedAt: new Date(Math.floor(new Date(m.expiresAt).getTime() / 1000) * 1000).toISOString(),
    };
  }
  if (m.status === "resolving") {
    const ag = MOCK_AGENTS;
    return {
      status: "deliberating" as const,
      confidence: 0.62,
      threshold: 0.65,
      startedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      votes: ag.map((a, i2) => ({
        agentId: a.id,
        callsign: a.callsign,
        vote: i2 >= 3 ? ("NO" as const) : ("YES" as const),
        confidence: [0.82, 0.78, 0.56, 0.71, 0.55, 0.63][i2] ?? 0.6,
        decidedAt: new Date(Date.now() - (30 - i2 * 4) * 60 * 1000).toISOString(),
        evidence: [
          {
            source: a.kind === "media-oracle" ? "reuters.com" : a.kind === "onchain-oracle" ? "etherscan.io" : "official",
            url: "https://example.com",
            snippet: `Cross-checked ${m.title.split("?")[0].toLowerCase()} against ${a.callsign} primary feed.`,
            timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
            kind: (a.kind === "media-oracle"
              ? "news"
              : a.kind === "onchain-oracle"
              ? "onchain"
              : "api") satisfies "news" | "onchain" | "api",
          },
        ],
      })),
    };
  }
  if (m.status === "resolved") {
    const resolvedVote = m.resolvedOutcome ?? ("YES" as const);
    return {
      status: "consensus" as const,
      outcome: m.resolvedOutcome,
      confidence: 0.92,
      threshold: 0.65,
      startedAt: new Date(new Date(m.resolvedAt!).getTime() - 18 * 60 * 1000).toISOString(),
      finalizedAt: m.resolvedAt,
      votes: MOCK_AGENTS.map((a, i2) => ({
        agentId: a.id,
        callsign: a.callsign,
        vote: i2 >= 3 && resolvedVote === "YES" ? ("NO" as const) : resolvedVote,
        confidence: [0.96, 0.94, 0.88, 0.90, 0.85, 0.92][i2] ?? 0.9,
        decidedAt: new Date(new Date(m.resolvedAt!).getTime() - (15 - i2 * 2) * 60 * 1000).toISOString(),
        evidence: [
          {
            source: "official",
            url: "https://example.com",
            snippet: `Outcome confirmed via ${a.callsign} primary feed and one corroborating wire.`,
            timestamp: new Date(new Date(m.resolvedAt!).getTime() - 10 * 60 * 1000).toISOString(),
            kind: "official" as const,
          },
        ],
      })),
    };
  }
  return undefined;
}

export function marketBySlug(slug: string) {
  return MOCK_MARKETS.find((m) => m.slug === slug);
}

export const MOCK_TRADES: Trade[] = MOCK_MARKETS.flatMap((m, i) =>
  Array.from({ length: 6 }).map((_, j) => ({
    id: `tr_${m.id}_${j}`,
    marketId: m.id,
    marketTitle: m.title,
    side: (j % 3 === 0 ? "NO" : "YES") as "YES" | "NO",
    price: Math.max(0.02, Math.min(0.98, m.yesPrice + (Math.sin(i + j) * 0.05))),
    shares: 50 + ((i * 7 + j * 11) % 220),
    at: new Date(Date.now() - (j * 11 + i * 3) * 60 * 1000).toISOString(),
    user: {
      name: ["nodewatcher", "edgecase.eth", "fader", "longvol", "sweep", "quant.box"][j % 6],
      address: `0x${(0x10000 + j * 1311 + i * 2937).toString(16).padStart(12, "0")}c4d8a9F0bC4d8a9F1`,
    },
  })),
);
