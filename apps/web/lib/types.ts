export type Category =
  | "crypto"
  | "sports"
  | "politics"
  | "weather"
  | "tech"
  | "finance"
  | "entertainment";

export type MarketStatus = "live" | "resolving" | "resolved" | "disputed";

export type Outcome = "YES" | "NO";

export interface PricePoint {
  t: number; // unix seconds
  yes: number; // 0..1
}

export interface Market {
  id: string;
  slug: string;
  title: string;
  description: string;
  resolutionCriteria: string;
  category: Category;
  status: MarketStatus;
  resolvedOutcome?: Outcome;
  createdAt: string;
  expiresAt: string;
  resolvedAt?: string;
  yesPrice: number; // 0..1
  volumeUSD: number;
  liquidityUSD: number;
  traders: number;
  history: PricePoint[];
  creator: { name: string; address: string };
  imageHint: string; // category emoji or short
  consensus?: AIConsensus;
  related?: string[];
}

export type AgentKind =
  | "exchange-oracle"
  | "media-oracle"
  | "onchain-oracle"
  | "tech-oracle"
  | "regulation-oracle"
  | "macro-oracle";

export interface Agent {
  id: string;
  name: string;
  callsign: string; // e.g. BULL-1
  kind: AgentKind;
  description: string;
  modelHint: string; // "Claude 4.7" / "GPT" / "B.AI" — just labels
  region: string;
  uptimePct: number;
  resolutions: number;
  accuracyPct: number;
  avgConfidence: number;
  status: "online" | "syncing" | "offline";
  tier?: string;
  weight?: number;
}

export interface AgentVote {
  agentId: string;
  callsign: string;
  vote: Outcome;
  confidence: number; // 0..1
  evidence: Evidence[];
  decidedAt: string;
  tier?: string;
  weight?: number;
}

export interface Evidence {
  source: string; // e.g. "coingecko.com"
  url: string;
  snippet: string;
  timestamp: string;
  kind: "api" | "news" | "onchain" | "social" | "official";
}

export interface AIConsensus {
  status: "pending" | "deliberating" | "consensus" | "dispute";
  outcome?: Outcome;
  confidence: number; // 0..1
  threshold: number; // 0..1 e.g. 0.75
  votes: AgentVote[];
  startedAt: string;
  finalizedAt?: string;
}

export interface Position {
  id: string;
  marketId: string;
  marketTitle: string;
  marketCategory: Category;
  side: Outcome;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  status: MarketStatus;
}

export interface Trade {
  id: string;
  marketId: string;
  marketTitle: string;
  side: Outcome;
  price: number;
  shares: number;
  at: string;
  user: { name: string; address: string };
}
