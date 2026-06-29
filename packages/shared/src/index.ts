export type Category = "crypto" | "sports" | "politics" | "weather" | "tech" | "finance" | "entertainment";
export type MarketStatus = "live" | "resolving" | "resolved" | "disputed";
export type Outcome = "YES" | "NO";
export interface PricePoint { t: number; yes: number; }
export interface Market {
  id: string; slug: string; title: string; description: string;
  resolutionCriteria: string; category: Category; status: MarketStatus;
  resolvedOutcome?: Outcome; createdAt: string; expiresAt: string;
  resolvedAt?: string; yesPrice: number; volumeUSD: number;
  liquidityUSD: number; traders: number; history: PricePoint[];
  creator: { name: string; address: string }; imageHint: string;
  consensus?: AIConsensus; related?: string[];
}
export type AgentKind = "exchange-oracle" | "media-oracle" | "onchain-oracle" | "sports-feed" | "weather-feed" | "election-monitor";
export interface Agent {
  id: string; name: string; callsign: string; kind: AgentKind;
  description: string; modelHint: string; region: string;
  uptimePct: number; resolutions: number; accuracyPct: number;
  avgConfidence: number; status: "online" | "syncing" | "offline";
}
export interface AgentVote {
  agentId: string; callsign: string; vote: Outcome;
  confidence: number; evidence: Evidence[]; decidedAt: string;
}
export interface Evidence {
  source: string; url: string; snippet: string;
  timestamp: string; kind: "api" | "news" | "onchain" | "social" | "official";
}
export interface AIConsensus {
  status: "pending" | "deliberating" | "consensus" | "dispute";
  outcome?: Outcome; confidence: number; threshold: number;
  votes: AgentVote[]; startedAt: string; finalizedAt?: string;
}
export interface Position {
  id: string; marketId: string; marketTitle: string;
  marketCategory: Category; side: Outcome; shares: number;
  avgPrice: number; currentPrice: number; status: MarketStatus;
}
export interface Trade {
  id: string; marketId: string; marketTitle: string;
  side: Outcome; price: number; shares: number;
  at: string; user: { name: string; address: string };
}
export interface ResolveResult { marketId: string; outcome: Outcome; confidence: number; threshold: number; votes: AgentVote[]; finalizedAt: string; }
export interface BuyRequest { marketId: string; side: Outcome; amountUSDD: number; }
export interface BuyResult { txHash: string; shares: number; avgPrice: number; }
export interface SettleRequest { marketId: string; outcome: Outcome; }
export interface SettleResult { txHash: string; paidOut: boolean; }
export interface PriceSnapshot { pair: string; price: number; volume24h: number; source: string; timestamp: number; }
export interface WalletState { connected: boolean; address: string; network: "tron-testnet" | "tron-mainnet"; balanceUSDD: number; }
export interface CreateMarketInput { title: string; description: string; resolutionCriteria: string; category: Category; expiresAt: string; initialLiquidity: number; }
